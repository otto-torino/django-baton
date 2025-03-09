Blackbox Modifications for Django-Baton Django Admin
----------------------------------------------------

To recompile, run the following command. After recompiling, set the `$PROJECT_PATH` environment variable to the path of your project, replacing `fahrschulfux-backend` with your project name. Finally, copy the `baton.min.js` file to your project's static directory.

Remember to update the publicPath in baton/static/baton/app/webpack.common.js

```bash
#!/bin/bash

export PROJECT_PATH=../fahrschulfux-backend
(cd baton/static/baton/app && npm install && npm run compile)
/bin/cp -f baton/static/baton/app/dist/* $PROJECT_PATH/static/baton/ && git checkout -- baton/static/baton/app/dist/ && git clean -f -d baton/static/baton/app/dist/
```

**Important Versioning Notes:**

There are two options to handle updates to django-baton:

1.  **Stay on a specific version:** Do not directly update `django-baton` within the `fahrschulfux-backend` project (or your project).  It is recommended to remain on django-baton version 2.7.1 in the `fahrschulfux-backend` project to avoid potential conflicts.

2.  **Update through this repository:** If you need a newer version of `django-baton` or want to incorporate the latest changes, follow this process:
    *   Pull the latest version of `django-baton` *in this repository* (where this `README_blackbox.md` file resides).
    *   Make any necessary modifications or customizations here.
    *   Recompile the JavaScript as described in the commands above.
    *   *Then*, update the `django-baton` version in your `fahrschulfux-backend` project (or your project) and copy the newly compiled `baton.min.js` to the appropriate static directory. This ensures that your project uses the modified and tested version.

This approach isolates changes and prevents unintended consequences from directly updating `django-baton` within the main project.
