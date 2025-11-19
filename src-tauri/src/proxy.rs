use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ProxyConfig {
    pub host: String,
    pub port: String,
    pub username: Option<String>,
    pub password: Option<String>,
}

#[tauri::command]
pub async fn fetch_with_proxy(url: String, proxy_config: Option<ProxyConfig>) -> Result<String, String> {
    use reqwest::Client;

    let client = if let Some(proxy) = proxy_config {
        // Build proxy URL
        let proxy_url = if let (Some(username), Some(password)) = (&proxy.username, &proxy.password) {
            format!("http://{}:{}@{}:{}", username, password, proxy.host, proxy.port)
        } else {
            format!("http://{}:{}", proxy.host, proxy.port)
        };

        eprintln!("Using proxy: {}", proxy_url);

        let proxy = reqwest::Proxy::all(&proxy_url)
            .map_err(|e| format!("Failed to create proxy: {}", e))?;

        Client::builder()
            .proxy(proxy)
            .build()
            .map_err(|e| format!("Failed to build client with proxy: {}", e))?
    } else {
        // No proxy
        Client::builder()
            .build()
            .map_err(|e| format!("Failed to build client: {}", e))?
    };

    // Make the request
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    // Get response text
    let text = response
        .text()
        .await
        .map_err(|e| format!("Failed to read response: {}", e))?;

    Ok(text)
}
