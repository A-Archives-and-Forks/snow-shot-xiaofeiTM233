pub fn get_focused_window() -> () {
    log::warn!("[os::utils::linux::get_focused_window] not implemented");

    ()
}

pub fn switch_always_on_top() -> () {
    log::warn!("[os::utils::linux::switch_always_on_top] not implemented");

    ()
}

pub fn set_draw_window_style(window: tauri::Window) {
    log::warn!("[os::utils::linux::set_draw_window_style] not implemented");

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

    // 使用 std::process::Command 直接启动新进程
    // 传递 --restart-instance 参数，标记这是重启操作
    match std::process::Command::new(&current_exe)
        .arg("--restart-instance")
        .spawn()
    {
        Ok(_child) => {
            // 新进程已启动，立即退出当前进程
            // 新进程通过 --restart-instance 参数可以绕过单实例检测
            log::info!("[restart] New process spawned, exiting current process");
            std::process::exit(0);
        }
        Err(e) => {
            return Err(format!("[restart] Failed to spawn process: {:?}", e));
        }
    }
}

pub fn is_admin() -> bool {
    false
}
