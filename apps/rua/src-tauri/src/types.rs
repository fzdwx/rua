use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Application {
  pub name: String,
  pub exec: String,
  pub icon: Option<String>,
  pub description: Option<String>,
  pub path: String,
  pub terminal: bool,
}

#[derive(Debug, Serialize)]
pub struct ShellResult {
  pub success: bool,
  pub stdout: String,
  pub stderr: String,
  pub exit_code: Option<i32>,
}
