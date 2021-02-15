# Contributing

Contributions are welcome, and they are greatly appreciated! Every
little bit helps, and credit will always be given.

You can contribute in many ways:

## Types of Contributions

### Report Bugs

Report bugs at https://github.com/otto-torino/django-baton/issues.

If you are reporting a bug, please include:

* Your operating system name and version.
* Any details about your local setup that might be helpful in troubleshooting.
* Detailed steps to reproduce the bug.

### Fix Bugs

Look through the GitHub issues for bugs. Anything tagged with "bug"
is open to whoever wants to implement it.

### Implement Features

Look through the GitHub issues for features. Anything tagged with "feature"
is open to whoever wants to implement it.

### Write Documentation

Django Baton could always use more documentation, whether as part of the 
official Django Lineup docs, in docstrings, or even on the web in blog posts,
articles, and such.

### Submit Feedback

The best way to send feedback is to comment in the discussions page at https://github.com/otto-torino/django-baton/discussions.

If you are proposing a feature:

* Explain in detail how it would work.
* Keep the scope as narrow as possible, to make it easier to implement.
* Remember that this is a volunteer-driven project, and that contributions
  are welcome :)

## Get Started!

Ready to contribute? Here's how to set up `django-baton` for local development.

1. Fork the `django-baton` repo on GitHub.
2. Clone your fork locally::

    $ git clone git@github.com:your_name_here/django-baton.git

3. Install your local copy into a virtualenv. Assuming you have virtualenvwrapper installed, this is how you set up your fork for local development

    Start the test app (login admin:admin)::

    ```
    $ cd testapp
    $ python3 -m venv .virtualenv
    $ cd app
    $ pip install -r requirements.txt
    $ python manage.py runserver
    ```

    Switch the baton js path in `base_site.html`::

    ```
    <!-- <script src="{% static 'baton/app/dist/baton.min.js' %}"></script> comment the compiled src and uncomment the webpack served src -->
    <script src="http://localhost:8080/dist/baton.min.js"></script>
    ```

    Start the js app in watch mode::

    ```
    $ cd baton/static/baton/app
    $ npm install
    $ npm run dev
    ```

    Now you'll see live all your changes in the testapp.

4. Create a branch for local development::

    ```
    $ git checkout -b name-of-your-bugfix-or-feature
    ```

   Now you can make your changes locally.

5. When you're done making changes, check that your changes pass all tests (with the test app running)::

    ```
    $ cd testapp/app
    $ python manage.py test
    ```

6. Commit your changes and push your branch to GitHub::

    ```
    $ git add .
    $ git commit -m "Your detailed description of your changes."
    $ git push origin name-of-your-bugfix-or-feature
    ```

7. Submit a pull request through the GitHub website.

## Pull Request Guidelines

Before you submit a pull request, check that it meets these guidelines:

1. The pull request should include tests.
2. Python code should follow PEP8 guidelines, Javascript code should respect the `.eslintrc` configuration.
3. If the pull request adds functionality, the docs should be updated. Put
   your new functionality into a function with a docstring, and add the
   feature to the list in README.md.
4. The pull request should work for python >= 3, Django >= 2.1, and for PyPy. Check 
   https://travis-ci.org/otto-torino/django-baton/pull_requests
   and make sure that the tests pass for all supported Python versions.
