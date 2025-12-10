use std::process;

const SERVER_URL: &str = "http://127.0.0.1:7777";

#[derive(serde::Deserialize)]
struct Response {
    success: bool,
    message: String,
}

fn send_request(endpoint: &str) -> Result<Response, Box<dyn std::error::Error>> {
    let url = format!("{}{}", SERVER_URL, endpoint);
    let client = reqwest::blocking::Client::new();
    let response = client.post(&url).send()?;
    let response_data: Response = response.json()?;
    Ok(response_data)
}

fn toggle() {
    match send_request("/toggle") {
        Ok(resp) => {
            if resp.success {
                println!("{}", resp.message);
                process::exit(0);
            } else {
                eprintln!("Error: {}", resp.message);
                process::exit(1);
            }
        }
        Err(e) => {
            eprintln!("Failed to connect to rua: {}", e);
            eprintln!("Make sure rua is running.");
            process::exit(1);
        }
    }
}

fn health() {
    match send_request("/health") {
        Ok(resp) => {
            if resp.success {
                println!("✓ {}", resp.message);
                process::exit(0);
            } else {
                eprintln!("Error: {}", resp.message);
                process::exit(1);
            }
        }
        Err(e) => {
            eprintln!("Failed to connect to rua: {}", e);
            eprintln!("Make sure rua is running.");
            process::exit(1);
        }
    }
}

fn print_usage() {
    println!("ruactl - Control utility for rua");
    println!();
    println!("USAGE:");
    println!("    ruactl <COMMAND>");
    println!();
    println!("COMMANDS:");
    println!("    toggle    Toggle window visibility");
    println!("    health    Check if rua is running");
    println!("    help      Print this help message");
}

fn main() {
    let args: Vec<String> = std::env::args().collect();

    if args.len() < 2 {
        print_usage();
        process::exit(1);
    }

    match args[1].as_str() {
        "toggle" => toggle(),
        "health" => health(),
        "help" | "--help" | "-h" => {
            print_usage();
            process::exit(0);
        }
        cmd => {
            eprintln!("Unknown command: {}", cmd);
            eprintln!();
            print_usage();
            process::exit(1);
        }
    }
}
