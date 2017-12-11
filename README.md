# PRbot

Post stats on open PRs for a Github repo in Slack.

## Prerequisites

* Node 6+
* Yarn (npm install --global yarn)

## Credentials

Github:

* Generate a Github personal access token: https://github.com/settings/tokens

Slack:

* Create a Slack app: https://api.slack.com/apps
* In the app, open **Incoming Webbooks**
* Choose to **Add New Webhook to Workspace**
* Pick the channel you want to post to and authorize
* Copy the resulting webhook URL

## Install

    git clone https://github.com/bruz/prbot.git
    cd prbot
    yarn install

## Debug locally

    export GITHUB_OWNER=<GITHUB REPO OWNER USERNAME>
    export GITHUB_REPO=<GITHUB REPO NAME>
    export GITHUB_TO_SLACK_USERS={"<GITHUB USERNAME>": "<SLACK USERNAME>, ..."}
    export GITHUB_PERSONAL_ACCESS_TOKEN=<PERSONAL ACCESS TOKEN>
    export SLACK_WEBHOOK_URL=<WEBBOOK URL FROM SLACK>

    node index.js DEBUG

# Deploy with AWS Lambda

This assumes you want to run PRbot on a fixed schedule, but there are also a number of other ways it could be triggered in AWS.

* Locally, build a ZIP file to deploy:

    yarn zip

* Go to AWS Lambda in the AWS console
* Choose to create a new function
* Use Node 6.10 as the runtime
* Change code entry type to **Upload a .ZIP file**, and upload the `prbot.zip` file generated earlier.
* Define environment variables:
  * GITHUB_OWNER
  * GITHUB_REPO
  * GITHUB_TO_SLACK_USERS
  * GITHUB_PERSONAL_ACCESS_TOKEN
  * SLACK_WEBHOOK_URL
* Save the function, and test. It should output to the configured Slack channel if all is well.
* Go to CloudWatch in the AWS
* Go into **Events -> Rules**
* Choose to create a rule
* Set event source as **Schedule**
* Define the schedule you want
* Add a target as the Lambda function you previously created
* Choose **Configure details**, name the rule and save it
