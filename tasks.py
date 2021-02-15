import os
import webbrowser

from invoke import task


def open_browser(path):
    try:
        from urllib import pathname2url
    except:
        from urllib.request import pathname2url
    webbrowser.open("file://" + pathname2url(os.path.abspath(path)))


@task
def docs(c):
    """
    Build the documentation and open it in the browser
    """
    c.run("sphinx-apidoc -o docs/ baton")

    c.run("sphinx-build -E -b html docs docs/_build")
    open_browser(path='docs/_build/index.html')

