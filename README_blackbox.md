Blackbox Modifications for Django-Baton Django Admin
----------------------------------------------------

To recompile, run the following command. After recompiling, set the `$PROJECT_PATH` environment variable to the path of your project, replacing `modulu-backend` with your project name. Finally, copy the `baton.min.js` file to your project's static directory.

Remember to update the publicPath in baton/static/baton/app/webpack.common.js

````
#!/bin/bash

export PROJECT_PATH=../modulu-backend
(cd baton/static/baton/app && npm install && npm run compile)
cp -f baton/static/baton/app/dist/* $PROJECT_PATH/static/baton/ && git checkout -- baton/static/baton/app/dist/ && git clean -f -d baton/static/baton/app/dist/

```

