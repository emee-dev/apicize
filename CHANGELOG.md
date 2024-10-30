# Change Log

# 0.8.3

* Fix request cloning when body has data
* Add request body beautification for JSON/XML

# 0.8.2

* Fix Run result dropdown formatting, more prep to spin off lib-rust

# 0.8.1

* Move child projects to from @apicize/ to apicize/ folder for prepreation of crates.io publish and monorepo breakup

# 0.8.0

* Overhaul of sequential/concurrent handling for requests and groups
* UI enhancement

# 0.7.1

* Switch to splitter view of request/ersponse
* Fix certificate and proxy validation
* Other UI cleanup

# 0.7.0

* Get rid of x-data-grid

# 0.6.11

* Fix variable substitution issue on requests

# 0.6.10

* Add Clippy/lint to pipeline and clean up

# 0.6.9

* Display warning on save if any auths or certs are stored directly in Workbook (not priv or local global)

# 0.6.8

* Display warnings when specified parameters are not found in private or global files

# 0.6.7

* Added STDIN/STDOUt support to CLI
* Fixed multi-run output in GUI
* Added some additional help content

# 0.6.6

* Added output file name parameter to CLI
* Prevented inheritance of parameters when value is set

# 0.6.5

* Add in workbook parameter defaults
* Move workbook defaults and global settings to a navigation item

# 0.6.4

* Return product name back to sentence case

# 0.6.3

* Set log timestamps as relative to start of execution

# 0.6.2

* Add deployment packages for CLI

# 0.6.1

* Fix help screen in light mode
* Improve results dropdown

# 0.6.0

* Tauri 2.0 release
* Improved nested group handling
* Updated CLI to use color formatting and arg parsing

# 0.5.12

* Configurable text size and light/dark scheme

# 0.5.11

* Navigation UI tuning

# 0.5.10

* Set clipboard to use interim event in v2-yarn-friendly branch

# 0.5.9

* Fix duplicate scenario and certificate
* Fix test result log word wrap

# 0.5.8

* Copy demo to documents directory upon creation
* Add check for config director

# 0.5.7

* Fix OAuth expiration detection
* Fix OAuth token clearing
* Acccessibility enhancements

# 0.5.6

* Migrate toast/confirm states from useState to mobx

# 0.5.5

* Fix "dirty" close dialog for release build

# 0.5.4

* Fix "Off" cascading parameters
* Update Tauri clipboard plugin to include large clipboard content fix

# 0.5.3

* Update Tauri CLI and other dependencies

# 0.5.2

* Restore hot keys, fix auth editor formatter

# 0.5.1

* Misc Bug Fixes

# 0.5.0

* Complete migration from Redux to mobx
* Clean up contexts/providers

# 0.4.3

* Fix close applciation warning on pending changes
* Restore clipboard image paste, since it appears to be working again

# 0.4.2

* Update open to work with changed Tauri dialog interface
* Fix request naviagation item insertion/moving
* Update group summary to scrollable view

# 0.4.1

* Fix run toolbar updating

# 0.4.0

* Migrate to Mobx

# 0.2.0

* Refactor to work with Tauri v2

# 0.1.0

* Initial attempt under Tauri v1