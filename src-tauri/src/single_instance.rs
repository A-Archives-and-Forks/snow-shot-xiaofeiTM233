use std::fs::File;
use std::io::{ErrorKind, Write};

/// 单实例检测的锁文件路径
const SINGLE_INSTANCE_LOCK_FILE: &str = "snow-shot.lock";

/// 检查进程是否还在运行
#[cfg(target_os = "windows")]
fn is_process_running(pid: u32) -> bool {
    use windows::Win32::System::Threading::{OpenProcess, PROCESS_QUERY_INFORMATION};
    use windows::Win32::Foundation::HANDLE;

    unsafe {
        let handle = OpenProcess(PROCESS_QUERY_INFORMATION, false, pid);
        if handle.is_ok() {
            let h = handle.unwrap();
            if !h.is_invalid() {
                // 进程存在
                return true;
            }
        }
    }
    false
}

#[cfg(any(target_os = "linux", target_os = "macos"))]
fn is_process_running(pid: u32) -> bool {
    use std::process::Command;

    // 使用 kill -0 检查进程是否存在
    let result = Command::new("kill")
        .arg("-0")
        .arg(pid.to_string())
        .output();

    match result {
        Ok(output) => output.status.success(),
        Err(_) => false,
    }
}

/// 检查是否是单实例
/// 如果检测到第二个实例且旧进程还在运行，返回 false
/// 如果是第一个实例或者旧进程已退出，返回 true
pub fn check_single_instance() -> bool {
    // 尝试创建锁文件
    let lock_path = std::env::temp_dir().join(SINGLE_INSTANCE_LOCK_FILE);

    match File::create_new(&lock_path) {
        Ok(mut file) => {
            // 成功创建锁文件，写入当前进程 ID
            let pid = std::process::id();
            if let Err(e) = writeln!(file, "{}", pid) {
                log::error!("[single_instance] Failed to write PID to lock file: {:?}", e);
            }

            log::info!("[single_instance] Instance started with PID: {}", pid);
            true
        }
        Err(e) if e.kind() == ErrorKind::AlreadyExists => {
            // 锁文件已存在，尝试读取其中的 PID
            let old_pid: u32 = match std::fs::read_to_string(&lock_path) {
                Ok(content) => content.trim().parse().unwrap_or(0),
                Err(_) => 0,
            };

            if old_pid == 0 {
                // 无法读取 PID，删除锁文件并继续
                log::warn!("[single_instance] Invalid lock file, removing it");
                let _ = std::fs::remove_file(&lock_path);
                return check_single_instance(); // 重试
            }

            // 检查旧进程是否还在运行
            if is_process_running(old_pid) {
                // 旧进程还在运行，阻止新实例启动
                log::warn!(
                    "[single_instance] Another instance is running with PID: {}",
                    old_pid
                );
                false
            } else {
                // 旧进程已退出，删除锁文件并继续
                log::info!("[single_instance] Old process exited, removing lock file");
                let _ = std::fs::remove_file(&lock_path);
                check_single_instance() // 重试
            }
        }
        Err(e) => {
            // 其他错误，允许启动（避免阻塞）
            log::error!("[single_instance] Failed to create lock file: {:?}", e);
            true
        }
    }
}

/// 清理锁文件（在应用退出时调用）
pub fn cleanup_lock_file() {
    let lock_path = std::env::temp_dir().join(SINGLE_INSTANCE_LOCK_FILE);

    match std::fs::remove_file(&lock_path) {
        Ok(_) => {
            log::info!("[single_instance] Lock file removed");
        }
        Err(e) => {
            log::warn!("[single_instance] Failed to remove lock file: {:?}", e);
        }
    }
}
