# keepalives
Automate logins to webapps to keep the tenant alive

## Installation

[Install Deno](https://docs.deno.com/runtime/getting_started/installation/)

Run `deno run -A npm:playwright install firefox` to install the necessary dependencies 

## Setup

To a `.env` file, enter your various username and passwords used for logins. Edit the scripts as needed to use those values.

To login on a regular schedule, use `cron` . `crontab -e` the easiest way to set that up.

## Example

The samples use ServiceNow and Asana values. Each webapp's HTML will differ so adjust the selectors as needed.
