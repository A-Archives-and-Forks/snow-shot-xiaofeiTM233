use std::time::Duration;

use device_query::{
    CallbackGuard, DeviceEvents, DeviceEventsHandlerInnerThread, Keycode, MouseButton,
    MousePosition,
};

const DEVICE_EVENT_HANDLER_FPS: u64 = 100;

pub struct DeviceEventHandlerService {
    fps: u64,
    /* 设备事件处理 */
    device_event_handler: Option<DeviceEventsHandlerInnerThread>,
}

impl DeviceEventHandlerService {
    pub fn new() -> Self {
        Self {
            fps: DEVICE_EVENT_HANDLER_FPS,
            device_event_handler: None,
        }
    }

    pub fn set_fps(&mut self, fps: u64) {
        self.fps = fps;
    }

    pub fn get_device_event_handler(&mut self) -> Result<&DeviceEventsHandlerInnerThread, String> {
    	if self.device_event_handler.is_some() {
    		return Ok(&self.device_event_handler.as_ref().unwrap());
    	}
   
    	#[cfg(target_os = "macos")]
    	{
    		log::info!("[DeviceEventHandlerService] Checking macOS accessibility permission...");
    		if !macos_accessibility_client::accessibility::application_is_trusted() {
    			log::error!("[DeviceEventHandlerService] Accessibility is not enabled - user needs to grant permission in System Settings > Privacy & Security > Accessibility");
    			return Err(format!(
    				"[DeviceEventHandlerService] Accessibility is not enabled - please grant permission in System Settings > Privacy & Security > Accessibility"
    			));
    		}
    		log::info!("[DeviceEventHandlerService] Accessibility permission granted successfully");
    	}
   
    	log::info!("[DeviceEventHandlerService] Creating device event handler with FPS: {}", self.fps);
    	let handler = DeviceEventsHandlerInnerThread::new(Duration::from_millis(1000 / self.fps));
   
    	self.device_event_handler = Some(handler);
    	log::info!("[DeviceEventHandlerService] Device event handler created successfully");
    	Ok(&self.device_event_handler.as_ref().unwrap())
    }

    pub fn on_mouse_move<Callback: Fn(&MousePosition) + Sync + Send + 'static>(
        &mut self,
        callback: Callback,
    ) -> Result<CallbackGuard<Callback>, String> {
        Ok(self.get_device_event_handler()?.on_mouse_move(callback))
    }

    pub fn on_mouse_down<Callback: Fn(&MouseButton) + Sync + Send + 'static>(
        &mut self,
        callback: Callback,
    ) -> Result<CallbackGuard<Callback>, String> {
        Ok(self.get_device_event_handler()?.on_mouse_down(callback))
    }

    pub fn on_mouse_up<Callback: Fn(&MouseButton) + Sync + Send + 'static>(
        &mut self,
        callback: Callback,
    ) -> Result<CallbackGuard<Callback>, String> {
        Ok(self.get_device_event_handler()?.on_mouse_up(callback))
    }

    pub fn on_key_down<Callback: Fn(&Keycode) + Sync + Send + 'static>(
        &mut self,
        callback: Callback,
    ) -> Result<CallbackGuard<Callback>, String> {
        Ok(self.get_device_event_handler()?.on_key_down(callback))
    }

    pub fn on_key_up<Callback: Fn(&Keycode) + Sync + Send + 'static>(
        &mut self,
        callback: Callback,
    ) -> Result<CallbackGuard<Callback>, String> {
        Ok(self.get_device_event_handler()?.on_key_up(callback))
    }

    pub fn release(&mut self) {
        self.device_event_handler.take();
    }
}
