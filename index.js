const Promise = require('bluebird');
const { IncomingWebhook } = require('@slack/client');
const GitHubApi = require('github');

const githubToSlack = JSON.parse(process.env.GITHUB_TO_SLACK_USERS);
const githubPersonalAccessToken = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
const owner = process.env.GITHUB_OWNER;
const repo = process.env.GITHUB_REPO;
const slackUrl = process.env.SLACK_WEBHOOK_URL;

const debug = process.argv[process.argv.length - 1] === 'DEBUG'

const github = new GitHubApi();

const postToSlack = (totalPRs, grouped, context) => {
  let message = `${totalPRs} PRs:\n`;
  for (const user in grouped) {
    const slackUser = githubToSlack[user];

    if (slackUser) {
      const { total, approved } = grouped[user];
      const approvedMessage = approved ? `(${approved} approved :white_check_mark:)` : '';
      message += `@${slackUser}: ${total} open ${approvedMessage}\n`;
    }
  };

  if (debug) {
    console.log(message);
  } else {
    const webhook = new IncomingWebhook(slackUrl);
    webhook.send(message, (err, header, statusCode) => {
      if (!err) {
        context.succeed('Received', statusCode, 'from Slack');
      }
    });
  }
};

const processResults = (pulls, prReviews, context) => {
  const approvals = prReviews.reduce((acc, reviews) => {
    if (reviews.length > 0) {
      acc[reviews[0].pull_request_url] = !!reviews.find((review) => {
        return review.state === 'APPROVED'
      });
    }
    return acc;
  }, {});

  const grouped = pulls.reduce((groups, pull) => {
    const user = pull.user.login;
    const { approved, total } = (groups[user] || { total: 0, approved: 0 });

    return Object.assign({}, groups, {
      [user]: {
        approved: approvals[pull.url] ? approved + 1 : approved,
        total: total + 1,
      },
    });
  }, {});

  postToSlack(pulls.length, grouped, context);
};

const getReviews = (pulls, context) => {
  const promises = pulls.map(pull => github.pullRequests.getReviews({
    owner,
    repo,
    number: pull.number,
  }));
  Promise.all(promises).then((reviewResponses) => {
    const prReviews = reviewResponses.map(res => res.data);
    processResults(pulls, prReviews, context);
  });
};

const handler = (_, context) => {
  github.authenticate({
    type: 'token',
    token: githubPersonalAccessToken,
  });

  github.pullRequests.getAll({
    owner,
    repo,
    per_page: 100,
  }).then(res => getReviews(res.data, context));
};

if (debug) {
  handler();
}

exports.handler = handler;
