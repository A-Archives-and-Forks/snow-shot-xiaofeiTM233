/// macOS 平台暂未实现原子窗口设置。
/// 调用方通过 #[cfg(target_os = "windows")] 确保仅 Windows 调用此函数，
/// 此实现仅为保持跨平台接口一致性，始终返回 Err。
pub fn set_window_rect_atomic(
    #[allow(unused_variables)] hwnd: *mut std::ffi::c_void,
    #[allow(unused_variables)] x: i32,
    #[allow(unused_variables)] y: i32,
    #[allow(unused_variables)] width: i32,
    #[allow(unused_variables)] height: i32,
) -> Result<(), String> {
    Err("[set_window_rect_atomic] not implemented on macOS, falling back to step-by-step resize".into())
}

pub fn get_focused_window() -> Option<()> {
    None
}

pub fn switch_always_on_top() -> () {
    log::warn!("[os::utils::macos::switch_always_on_top] not implemented");

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

/// 重启应用程序（不使用管理员权限）
pub fn restart() -> Result<(), String> {
    use std::env;
    use std::process::Command;

    // 获取当前可执行文件的路径
    let current_exe = match env::current_exe() {
        Ok(current_exe) => current_exe,
        Err(e) => {
            return Err(format!("[restart] env::current_exe failed: {:?}", e));
        }
    };
    let exe_path = current_exe.to_string_lossy();

    // 使用 sh -c 延迟启动新进程，确保旧进程有足够时间退出并释放单实例锁
    // sleep 1 大约延迟 1 秒
    let cmd = format!("sleep 1 && open \"{}\"", exe_path);

    match Command::new("sh").arg("-c").arg(&cmd).spawn() {
        Ok(_) => {
            // 退出当前进程，让单实例锁释放
            std::process::exit(0);
        }
        Err(e) => {
            return Err(format!("[restart] Failed to spawn restart process: {:?}", e));
        }
    }
}

pub fn is_admin() -> bool {
    false
}
