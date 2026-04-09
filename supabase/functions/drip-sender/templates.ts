// HTML email templates for each drip step.
// These are the production templates used by the edge function.
//
// The React Email versions in /emails/ are the design source of truth —
// use `npm run dev` in that directory to preview and edit them, then
// sync the HTML output back here.

export interface Template {
  subject: (firstName: string) => string;
  html: (firstName: string) => string;
}

export function getTemplate(step: number): Template | null {
  switch (step) {
    case 1:
      return step1;
    case 2:
      return step2;
    case 3:
      return step3;
    default:
      return null;
  }
}

const step1: Template = {
  subject: (firstName) => `Hi ${firstName} — quick intro`,
  html: (firstName) => `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px 16px;color:#111;line-height:1.6;">
  <p>Hi ${firstName},</p>
  <p>
    <!-- TODO: customize step 1 copy — first touch / introduction -->
    I wanted to reach out and introduce myself briefly.
  </p>
  <p>
    Would love to connect if the timing is right — happy to keep it short.
  </p>
  <p>Best,<br>[YOUR NAME]</p>
</body>
</html>`,
};

const step2: Template = {
  subject: (firstName) => `Following up, ${firstName}`,
  html: (firstName) => `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px 16px;color:#111;line-height:1.6;">
  <p>Hi ${firstName},</p>
  <p>
    <!-- TODO: customize step 2 copy — follow-up / value add -->
    Just following up on my previous note in case it got buried.
  </p>
  <p>
    Happy to jump on a quick call if that's easier than email.
  </p>
  <p>Best,<br>[YOUR NAME]</p>
</body>
</html>`,
};

const step3: Template = {
  subject: (firstName) => `Last note, ${firstName}`,
  html: (firstName) => `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px 16px;color:#111;line-height:1.6;">
  <p>Hi ${firstName},</p>
  <p>
    <!-- TODO: customize step 3 copy — final touch / closing -->
    I'll leave it here for now — just wanted to make sure my earlier notes didn't get lost.
  </p>
  <p>
    Feel free to reach out any time. The door's always open.
  </p>
  <p>Best,<br>[YOUR NAME]</p>
</body>
</html>`,
};
