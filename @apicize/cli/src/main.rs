use apicize_lib;
use apicize_lib::cleanup_v8;
use apicize_lib::models::apicize::{ApicizeExecution, ApicizeExecutionItem};
use apicize_lib::models::settings::ApicizeSettings;
use apicize_lib::models::Workspace;
use clap::Parser;
use colored::Colorize;
use core::panic;
use num_format::{SystemLocale, ToFormattedString};
use std::ffi::OsStr;
use std::path::PathBuf;
use std::process;
use std::sync::Arc;
use std::time::Instant;

/// Simple program to greet a person
#[derive(Parser, Debug)]
#[command(version, about, long_about = None)]
struct Args {
    /// Name of the file to run
    file: String,
    /// Name of the output file name for test results
    output: Option<String>,
}

fn duration_to_ms(d: u128, locale: &SystemLocale) -> String {
    let mut ms = d;
    let mins: u128 = ms / 60000;
    ms = ms - mins * 60000;
    let secs: u128 = ms / 1000;
    ms = ms - secs * 1000;
    format!("{:02}:{:02}{}{:03}", mins, secs, locale.decimal(), ms)
}

fn render_execution_item(item: &ApicizeExecutionItem, level: usize, locale: &SystemLocale) {
    let prefix = format!("{:width$}", "", width = level * 3);
    match item {
        ApicizeExecutionItem::Group(group) => {
            let title = format!(
                "{}{} ({} - {} ms)",
                &prefix,
                &group.name,
                duration_to_ms(group.executed_at, locale),
                &group.duration.to_formatted_string(locale),
            );
            println!("{}", title.white());
            for child in &group.items {
                render_execution_item(&child, level + 1, locale);
            }
        }
        ApicizeExecutionItem::Request(request) => {
            let title = format!(
                "{}{} ({} - {} ms)",
                prefix,
                &request.name,
                duration_to_ms(request.executed_at, locale),
                &request.duration.to_formatted_string(locale),
            );
            println!("{}", title.white());

            if let Some(test_response) = &request.tests {
                if let Some(test_results) = &test_response.results {
                    let test_prefix1 = format!("{:width$}", "", width = (level + 1) * 3);
                    let test_prefix2 = format!("{:width$}", "", width = (level + 2) * 3);
                    for result in test_results {
                        print!(
                            "{}{}",
                            test_prefix1.blue(),
                            &result.test_name.join(" ").blue()
                        );
                        if let Some(err) = &result.error {
                            println!(" {}", "[ERROR]".red());
                            println!("{}{}", test_prefix2, err.red().dimmed());
                        } else if result.success {
                            println!(" {}", "[PASS]".green());
                        } else {
                            println!(" {}", "[FAIL]".yellow());
                        }

                        if let Some(logs) = &result.logs {
                            for log in logs {
                                println!("{}{}", test_prefix2, log.white().dimmed());
                            }
                        }
                    }
                }
            }
        }
    }
}

fn render_execution(
    execution_result: &Result<ApicizeExecution, String>,
    level: usize,
    locale: &SystemLocale,
) -> usize {
    let mut failure_count = 0;

    match execution_result {
        Ok(execution) => {
            let use_level: usize = if (&execution.runs).len() > 1 {
                level + 1
            } else {
                level
            };

            let mut ctr = 0;
            for run in &execution.runs {
                if ctr > 0 {
                    println!();
                }

                if execution.runs.len() > 1 {
                    ctr = ctr + 1;
                    println!(
                        "{}Run {} of {}",
                        format!("{:width$}", "", width = level * 3),
                        ctr,
                        execution.runs.len()
                    );
                }

                for run_item in &run.items {
                    render_execution_item(&run_item, use_level, locale);
                }

                println!();
                println!("{}", "--------------- Totals ---------------".white());
                println!(
                    "{}{}",
                    "Passed Tests: ".white(),
                    if run.passed_test_count > 0 {
                        run.passed_test_count.to_formatted_string(locale).green()
                    } else {
                        "0".white()
                    }
                );

                println!(
                    "{}{}",
                    "Failed Tests: ".white(),
                    if run.failed_test_count > 0 {
                        run.failed_test_count.to_formatted_string(locale).yellow()
                    } else {
                        "0".white()
                    }
                );

                println!(
                    "{}{}",
                    "Requests with passed tests: ".white(),
                    if run.requests_with_passed_tests_count > 0 {
                        run.requests_with_passed_tests_count
                            .to_formatted_string(locale)
                            .green()
                    } else {
                        "0".white()
                    }
                );

                println!(
                    "{}{}",
                    "Requests with failed tests: ".white(),
                    if run.requests_with_failed_tests_count > 0 {
                        failure_count += run.requests_with_failed_tests_count;
                        run.requests_with_failed_tests_count
                            .to_formatted_string(locale)
                            .yellow()
                    } else {
                        "0".white()
                    }
                );

                println!(
                    "{}{}",
                    "Requests with errors: ".white(),
                    if run.requests_with_errors > 0 {
                        failure_count += run.requests_with_errors;
                        run.requests_with_errors.to_formatted_string(locale).red()
                    } else {
                        "0".white()
                    }
                );
                println!("{}", "--------------------------------------".white());
            }
        },
        Err(err) => {
            println!("{}{}", 
            format!("{:width$}", "", width = level * 3),
            err.red());
        }
    }

    failure_count
}

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let args = Args::parse();
    let stored_settings: Option<ApicizeSettings> = match ApicizeSettings::open() {
        Ok(serialized_settings) => Some(serialized_settings.data),
        Err(_err) => None,
    };

    let locale = SystemLocale::default().unwrap();
    let mut file_name = PathBuf::from(&args.file);

    let mut found = file_name.as_path().is_file();

    // Try adding extension if not in file name
    if !found {
        if file_name.extension() != Some(&OsStr::new("apicize")) {
            file_name.set_extension("apicize");
            found = file_name.as_path().is_file();
        }
    }

    // Try settings workbook path if defined
    if !found {
        if let Some(dir) = stored_settings.and_then(|s| s.workbook_directory) {
            let mut temp = PathBuf::from(dir);
            temp.push(&file_name);
            file_name = temp;
            found = file_name.as_path().is_file();
        }
    }

    if !found {
        panic!("Apicize file \"{}\" not found", &args.file);
    }

    println!(
        "{}{}",
        "Opening ".white(),
        &file_name.to_string_lossy().white()
    );

    let workspace: Workspace;
    match Workspace::open(&file_name) {
        Ok((wkspc, warnings)) => {
            workspace = wkspc;
            for warning in warnings {
                println!("WARNING: {warning}");
            }
        }
        Err(err) => {
            println!("Unable to read {}: {}", err.file_name, err.error);
            process::exit(-2);
        }
    }

    // initialize_v8();

    let request_ids = workspace.requests.top_level_ids.to_owned();
    let arc_workspace = Arc::new(workspace);
    let mut executions: Vec<Result<ApicizeExecution, String>> = Vec::new();

    let start = Instant::now();
    let arc_test_started = Arc::new(start);
    for request_id in request_ids {
        if let Some(request) = arc_workspace.requests.entities.get(&request_id) {
            let name = request.get_name();
            println!(
                "{}{}{}",
                "Calling ".blue(),
                if name.len() > 0 {
                    format!("{}", name.blue())
                } else {
                    format!("{} {}", "(Unnamed)".blue(), request.get_id().blue())
                },
                "...."
            );
            let result = Workspace::run(
                arc_workspace.clone(),
                &request_id,
                None,
                arc_test_started.clone(),
            )
            .await;
            executions.push(result);
        }
    }

    println!();
    println!("{}", "--------------- Results --------------".white());

    let mut failure_count = 0;
    let mut execution_ctr = 0;
    for execution in executions {
        println!();
        execution_ctr = execution_ctr + 1;
        failure_count += render_execution(&execution, 0, &locale);
    }

    // if let Some(output_filename) = args.output {
    //     let serialized = serde_json::to_string(&output_results).unwrap();
    //     match fs::write(&output_filename, serialized) {
    //         Ok(_) => println!("Test results written to {}", output_filename.blue()),
    //         Err(ref err) => panic!("Unable to write {} - {}", output_filename, err),
    //     }
    // }

    cleanup_v8();
    process::exit(failure_count as i32);
}
