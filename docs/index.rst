.. django-baton documentation master file, created by
   sphinx-quickstart on Wed Feb 15 12:25:38 2017.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

django-baton's documentation
========================================

A cool, modern and responsive django admin application based on bootstrap 5

Baton was developed with one concept in mind: **overwrite as few django templates as possible**.
Everything is done with css (sass and bootstrap mixins), and when the markup needs some edit, then DOM manipulation through js is used.

Features
--------

- Supports django >= 2.1
- Based on bootstrap 5 and Material Symbols
- Fully responsive
- Custom and flexible sidebar menu
- Text input filters facility
- Configurable form tabs
- Easy way to include templates in the change form page
- Collapsable stacke inline entries
- Lazy load of current uploaded images
- Full customization available recompiling the provided js app
- it translations

Getting started
---------------

.. toctree::
   :maxdepth: 2

   installation
   configuration
   ai
   page_detection
   signals
   js_utilities
   js_translations
   list_filters
   changelist_includes
   changelist_filters_includes
   changelist_row_attributes
   form_tabs
   form_includes
   collapsable_stackedinline

Advanced customization
----------------------

.. toctree::
   :maxdepth: 2

   customization
