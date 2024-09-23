use apicize_lib;
use apicize_lib::cleanup_v8;
use apicize_lib::models::Workspace;
use std::env;
use std::process;
use std::sync::Arc;

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let args: Vec<String> = env::args().collect();
    if args.len() != 2 {
        println!("Usage: (Input File Name)");
        process::exit(-1);
    }

    let file_name = &args[1];
    let workspace: Workspace;
    match Workspace::open(file_name) {
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

    let arc_workspace = Arc::new(workspace);

    let mut pass_count = 0;
    let mut fail_count = 0;

    let mut iter_ids = arc_workspace.requests.top_level_ids.iter();
    while let Some(request_id) = iter_ids.next() {

        if let Some(request) = arc_workspace.requests.entities.get(&request_id.clone()) {
            println!("{}", request.get_name());
        }

        let run_response = Workspace::run(arc_workspace.clone(), request_id, None).await;
        match run_response {
            Ok(results) => {
                println!("   Total execution time: {} ms", results.milliseconds);
                let mut run_number = 0;
                let total_runs = results.runs.len();
                results.runs.iter().for_each(|run| {
                    if total_runs > 1 {
                        run_number = run_number + 1;
                        println!("      Run {} of {}", run_number, total_runs);
                    }

                    run.iter().for_each(|result| {
                        if result.success {
                            match &result.tests {
                                Some(tests) => {
                                    // let r = response.as_ref().unwrap();
                                    // println!("{}", serde_json::to_string(r).unwrap());
                                    tests.iter().for_each(|tr| {
                                        if tr.success {
                                            println!("       - {} [PASS]", tr.test_name.join(" "));
                                            pass_count += 1;
                                        } else {
                                            println!(
                                                "       - {} [FAIL] {}",
                                                tr.test_name.join(", "),
                                                tr.error
                                                    .as_ref()
                                                    .unwrap_or(&String::from("       Unknown Error"))
                                            );
                                            fail_count += 1;
                                        }
                                    })
                                }
                                None => {}
                            }
                        } else {
                            println!(
                                " - [ERROR] {}",
                                match &result.error_message {
                                    Some(msg) => msg.clone(),
                                    None => String::from("Unexpected Error"),
                                }
                            );
                        }
                    })
                });
            }
            Err(err) => {
                println!(" - [ERROR] {}", err);
            }
        }
    }

    println!("Totals - Pass: {}, Fail: {}", pass_count, fail_count);

    cleanup_v8();
    process::exit(fail_count);
}
