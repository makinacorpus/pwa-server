let express = require("express");
let webPush = require("web-push");

const app = express()

if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  console.log("You must set the VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY "+
    "environment variables. You can use the following ones:");
  console.log(webPush.generateVAPIDKeys());
  return;
}

webPush.setVapidDetails(
  'https://serviceworke.rs/',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const subscriptions = {};
const pushInterval = 10;


function sendNotification(subscription) {
  webPush.sendNotification(subscription)
  .then(function() {
    console.log('Push Application Server - Notification sent to ' + subscription.endpoint);
  }).catch(function() {
    console.log('ERROR in sending Notification, endpoint removed ' + subscription.endpoint);
    delete subscriptions[subscription.endpoint];
  });
}

setInterval(function() {
  Object.values(subscriptions).forEach(sendNotification);
}, pushInterval * 1000);

app.listen(process.env.PORT, function () {
  app.get('/vapidPublicKey', function(req, res) {
    res.send(process.env.VAPID_PUBLIC_KEY);
  });

  app.post('/register', function(req, res) {
    var subscription = req.body.subscription;
    if (!subscriptions[subscription.endpoint]) {
      console.log('Subscription registered ' + subscription.endpoint);
      subscriptions[subscription.endpoint] = subscription;
    }
    res.type('js').send('{"success":true}');
  });

  app.post('/unregister', function(req, res) {
    var subscription = req.body.subscription;
    if (subscriptions[subscription.endpoint]) {
      console.log('Subscription unregistered ' + subscription.endpoint);
      delete subscriptions[subscription.endpoint];
    }
    res.type('js').send('{"success":true}');
  });
});