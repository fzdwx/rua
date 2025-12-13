import { invoke } from "@tauri-apps/api/core";

/**
 * Read text from clipboard
 * On Linux: uses xclip command
 * On other platforms: returns empty string
 */
export async function readClipboard(): Promise<string> {
    try {
        return await invoke<string>("read_clipboard");
    } catch (error) {
        console.error("Failed to read clipboard:", error);
        return "";
    }
}

/**
 * Write text to clipboard
 * On Linux: uses xclip command
 * On other platforms: no-op
 */
export async function writeClipboard(text: string): Promise<void> {
    try {
        await invoke("write_clipboard", { text });
    } catch (error) {
        console.error("Failed to write to clipboard:", error);
    }
}
