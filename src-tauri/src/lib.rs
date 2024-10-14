use futures::stream::{self, StreamExt};
use once_cell::sync::Lazy;
use serde_json::{from_str, json, to_string_pretty};
use std::fs::{create_dir_all, read_dir, read_to_string, write};
use std::path::Path;
use std::sync::Arc;
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_shell::process::CommandEvent;
use tauri_plugin_shell::ShellExt;
use tokio::sync::{Mutex, Semaphore};

const BATCH_SIZE: usize = 10;
const MAX_CONCURRENT: usize = 4;

static SEMAPHORE: Lazy<Arc<Semaphore>> =
    once_cell::sync::Lazy::new(|| Arc::new(Semaphore::new(MAX_CONCURRENT)));

#[derive(Debug, serde::Serialize, Clone)]
struct ThumbnailProgress {
    total: usize,
    completed: usize,
    current_file: String,
}

#[tauri::command]
fn handle_folder(app: AppHandle, path: String) -> Option<String> {
    // check if folder contains "www" folder
    let path = Path::new(&path);

    let www_path = path.join("www");

    if !www_path.exists() {
        return None;
    }

    let config_path = app.app_handle().path().app_data_dir().unwrap();

    create_dir_all(&config_path).unwrap();

    let config_file = config_path.join("config.json");

    let config = json!({
        "game_dir": path,
        "initialized": false
    });

    write(&config_file, to_string_pretty(&config).unwrap()).unwrap();

    return Some(path.to_str().unwrap().to_string());
}

#[tauri::command]
fn get_game_dir(app: AppHandle) -> Option<String> {
    let config_path = app
        .app_handle()
        .path()
        .app_data_dir()
        .unwrap()
        .join("config.json");

    if !config_path.exists() {
        let config = json!({});

        create_dir_all(config_path.parent().unwrap()).unwrap();

        write(&config_path, to_string_pretty(&config).unwrap()).unwrap();
    }

    let data = read_to_string(config_path).unwrap();

    let config: serde_json::Value = from_str(&data).unwrap();

    if let Some(game_dir) = config["game_dir"].as_str() {
        return Some(game_dir.to_string());
    }

    None
}

#[tauri::command]
fn load_videos(app: AppHandle) -> Vec<String> {
    let movies_path = Path::new(&get_game_dir(app).unwrap())
        .join("www")
        .join("movies");

    if !movies_path.exists() {
        return Vec::new();
    }

    let paths = read_dir(movies_path).unwrap();

    let mut files = Vec::new();

    for path in paths {
        if let Ok(entry) = path {
            if let Some(file_name) = entry.file_name().to_str() {
                files.push(file_name.to_string());
            }
        }
    }

    files
}

#[tauri::command]
async fn generate_thumbnails(
    app: AppHandle,
    filenames: Vec<String>,
) -> Result<Vec<String>, String> {
    let total = filenames.len();
    let completed = Arc::new(Mutex::new(0));

    let game_dir = Path::new(&get_game_dir(app.clone()).unwrap())
        .join("www")
        .join("movies");

    let app_data_path = app.path().app_data_dir().unwrap();

    let thumbnail_dir = app_data_path.join("thumbnails");

    if !thumbnail_dir.exists() {
        tokio::fs::create_dir_all(&thumbnail_dir)
            .await
            .map_err(|e| e.to_string())?;
    }

    let results = stream::iter(filenames.into_iter().enumerate())
        .map(|(_index, filename)| {
            let app = app.clone();
            let thumbnail_dir = thumbnail_dir.clone();
            let game_dir = game_dir.clone();
            let completed = completed.clone();
            async move {
                let thumbnail_path = thumbnail_dir.join(format!("{}.jpg", filename));

                if thumbnail_path.exists() {
                    *completed.lock().await += 1;
                    emit_progress(&app, total, *completed.lock().await, &filename);
                    return Ok(thumbnail_path.to_str().unwrap().to_string());
                }

                let permit = SEMAPHORE
                    .clone()
                    .acquire_owned()
                    .await
                    .map_err(|e| e.to_string())?;

                let result =
                    generate_single_thumbnail(&app, &filename, &game_dir, &thumbnail_path).await;

                drop(permit);

                *completed.lock().await += 1;

                emit_progress(&app, total, *completed.lock().await, &filename);

                result
            }
        })
        .buffer_unordered(BATCH_SIZE)
        .collect::<Vec<Result<String, String>>>()
        .await;

    app.emit("thumbnail_generation_complete", json!({ "total": total }))
        .unwrap();

    results.into_iter().collect()
}

fn emit_progress(app: &AppHandle, total: usize, completed: usize, current_file: &str) {
    app.emit(
        "thumbnail_generation_progress",
        ThumbnailProgress {
            total,
            completed,
            current_file: current_file.to_string(),
        },
    )
    .unwrap();
}

async fn generate_single_thumbnail(
    app: &AppHandle,
    filename: &str,
    game_dir: &Path,
    thumbnail_path: &Path,
) -> Result<String, String> {
    let sidecar_command = app.shell().sidecar("ffmpeg").unwrap().args([
        "-i",
        &game_dir.join(filename).to_str().unwrap().to_string(),
        "-ss",
        "00:00:01",
        "-frames:v",
        "1",
        "-q:v",
        "2",
        thumbnail_path.to_str().unwrap(),
    ]);

    let (mut rx, mut _child) = sidecar_command.spawn().expect("failed to spawn sidecar");

    while let Some(event) = rx.recv().await {
        if let CommandEvent::Stdout(line_bytes) = event {
            let line = String::from_utf8_lossy(&line_bytes);
            println!("{}", line);
        }
    }

    Ok(thumbnail_path.to_str().unwrap().to_string())
}

#[tauri::command]
async fn get_video(app: AppHandle, filename: String) -> Option<String> {
    if filename.is_empty() {
        return None;
    }

    let game_dir = Path::new(&get_game_dir(app).unwrap())
        .join("www")
        .join("movies");

    let video_path = game_dir.join(&filename);

    if !video_path.exists() {
        return None;
    }

    Some(video_path.to_str().unwrap().to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            handle_folder,
            get_game_dir,
            load_videos,
            generate_thumbnails,
            get_video
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
