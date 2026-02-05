pub fn get_focused_window() -> Option<()> {
    None
}

pub fn switch_always_on_top() -> () {
    log::warn!("[os::utils::linux::switch_always_on_top] not implemented");

    ()
}

pub fn set_draw_window_style(#[allow(unused_variables)] window: tauri::Window) {
    // macOS 无需实现

    ()
}

pub fn create_admin_auto_start_task() -> Result<(), String> {
    Ok(())
}

pub fn delete_admin_auto_start_task() -> Result<(), String> {
    Ok(())
}

pub fn restart_with_admin() -> Result<(), String> {
    Ok(())
}

pub fn restart() -> Result<(), String> {
    // 获取当前可执行文件的路径
    let current_exe = match env::current_exe() {
        Ok(current_exe) => current_exe,
        Err(e) => {
            return Err(format!(
                "[restart] env::current_exe failed: {:?}",
                e
            ));
        }
    };
    let exe_path = current_exe.to_string_lossy().to_string();

    // 使用 bash -c 来执行命令：等待1秒后启动新进程
    // 这样确保当前进程已经退出，新进程才启动，不会触发单实例检测
    let command = format!("sleep 1 && {} &", exe_path);

    match std::process::Command::new("sh")
        .args(["-c", &command])
        .spawn()
    {
        Ok(_child) => {
            log::info!("[restart] Restart command scheduled");

            // 立即退出当前进程，不等待
            // 新进程会在1秒后启动，此时当前进程已经退出，单实例锁已释放
            log::info!("[restart] Exiting current process");
            std::process::exit(0);
        }
        Err(e) => {
            return Err(format!("[restart] Failed to schedule restart: {:?}", e));
        }
    }
}

pub fn is_admin() -> bool {
    false
}
