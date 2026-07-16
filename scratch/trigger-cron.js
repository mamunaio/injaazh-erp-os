const secret = "my_super_secret_cron_token_123";
fetch('http://localhost:3000/api/cron/process-outreach?token=' + secret)
  .then(r => r.json())
  .then(data => console.log(data))
  .catch(e => console.error(e));
