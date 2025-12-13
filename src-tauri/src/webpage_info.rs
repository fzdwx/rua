use serde::{Deserialize, Serialize};
use reqwest::Url;
use webpage::{Webpage, WebpageOptions};

#[derive(Debug, Serialize, Deserialize)]
pub struct PageInfo {
    pub title: Option<String>,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub image: Option<String>,
}

#[tauri::command]
pub async fn fetch_page_info(url: String) -> Result<PageInfo, String> {
    // Run blocking operation in a separate thread
    let result = tokio::task::spawn_blocking(move || {
        let mut options = WebpageOptions::default();
        options.allow_insecure = true;
        options.follow_location = true;
        options.max_redirections = 5;
        options.timeout = std::time::Duration::from_secs(10);
        options.useragent = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36".to_string();

        match Webpage::from_url(&url, options) {
            Ok(page) => {
                let html = &page.html;
                
                // Get title from HTML or Open Graph
                let title = html.title.clone()
                    .or_else(|| html.opengraph.properties.get("title").cloned());
                
                // Get description from meta or Open Graph
                let description = html.description.clone()
                    .or_else(|| html.opengraph.properties.get("description").cloned());
                
                // Get icon - try multiple sources
                let icon = get_best_icon(html, &url);
                
                // Get image from Open Graph
                let image = html.opengraph.images.first()
                    .map(|img| img.url.clone());
                
                Ok(PageInfo {
                    title,
                    description,
                    icon,
                    image,
                })
            }
            Err(e) => Err(format!("Failed to fetch page: {}", e))
        }
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?;
    
    result
}

fn get_best_icon(html: &webpage::HTML, base_url: &str) -> Option<String> {
    // 1. Try apple-touch-icon first (usually higher quality)
    if let Some(icon) = html.meta.get("apple-touch-icon") {
        return Some(normalize_url(icon, base_url));
    }
    
    // 2. Try icon from meta
    if let Some(icon) = html.meta.get("icon") {
        return Some(normalize_url(icon, base_url));
    }
    
    // 3. Try Open Graph image as fallback
    if let Some(img) = html.opengraph.images.first() {
        return Some(img.url.clone());
    }
    
    // 4. Default to /favicon.ico
    if let Ok(parsed_url) = Url::parse(base_url) {
        return Some(format!("{}://{}/favicon.ico", parsed_url.scheme(), parsed_url.host_str().unwrap_or("")));
    }
    
    None
}

fn normalize_url(icon_url: &str, base_url: &str) -> String {
    if icon_url.starts_with("http://") || icon_url.starts_with("https://") {
        return icon_url.to_string();
    }
    
    if icon_url.starts_with("//") {
        return format!("https:{}", icon_url);
    }
    
    if let Ok(base) = Url::parse(base_url) {
        if icon_url.starts_with('/') {
            return format!("{}://{}{}", base.scheme(), base.host_str().unwrap_or(""), icon_url);
        } else {
            return format!("{}://{}/{}", base.scheme(), base.host_str().unwrap_or(""), icon_url);
        }
    }
    
    icon_url.to_string()
}
