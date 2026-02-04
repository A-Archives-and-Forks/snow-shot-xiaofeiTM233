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

    // 使用 std::process::Command 启动新进程
    let mut command = std::process::Command::new(&current_exe);

    match command.spawn() {
        Ok(_) => {
            // 新进程已成功启动，延迟退出以确保单实例检测完成
            std::thread::sleep(std::time::Duration::from_millis(2000));
            std::process::exit(0);
        }
        Err(e) => {
            return Err(format!(
                "[restart] Failed to spawn process: {:?}", e
            ));
        }
    }
}

pub fn is_admin() -> bool {
    false
}
