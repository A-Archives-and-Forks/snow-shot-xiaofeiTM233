use std::fs::File;
use std::io::{ErrorKind, Write};

/// 单实例检测的锁文件路径
const SINGLE_INSTANCE_LOCK_FILE: &str = "snow-shot.lock";

/// 检查是否是单实例
/// 如果检测到第二个实例且不是重启操作，返回 false
/// 如果是第一个实例或者重启操作，返回 true
pub fn check_single_instance() -> bool {
    // 检查命令行参数
    let args: Vec<String> = std::env::args().collect();
    let is_restart = args.contains(&"--restart-instance".to_string());

    // 如果是重启操作，允许启动
    if is_restart {
        log::info!("[single_instance] Restart operation detected, allowing new instance");
        return true;
    }

    // 尝试创建锁文件
    let lock_path = std::env::temp_dir().join(SINGLE_INSTANCE_LOCK_FILE);

    match File::create_new(&lock_path) {
        Ok(mut file) => {
            // 成功创建锁文件，写入当前进程 ID
            let pid = std::process::id();
            if let Err(e) = writeln!(file, "{}", pid) {
                log::error!("[single_instance] Failed to write PID to lock file: {:?}", e);
            }
            log::info!("[single_instance] First instance started with PID: {}", pid);
            true
        }
        Err(e) if e.kind() == ErrorKind::AlreadyExists => {
            // 锁文件已存在，说明已有实例在运行
            log::warn!("[single_instance] Another instance is already running");

            // 尝试读取锁文件中的 PID
            if let Ok(content) = std::fs::read_to_string(&lock_path) {
                let old_pid: u32 = content.trim().parse().unwrap_or(0);
                log::info!("[single_instance] Old instance PID: {}", old_pid);
            }

            false
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
