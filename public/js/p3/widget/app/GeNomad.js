define([
    'dojo/_base/declare', 'dojo/_base/array', 'dojo/topic', 'dijit/_WidgetBase', 'dojo/on',
    'dojo/dom-class', 'dijit/_TemplatedMixin', 'dijit/_WidgetsInTemplateMixin',
    'dojo/text!./templates/GeNomad.html', './AppBase',
    'dojo/_base/lang', '../../WorkspaceManager'
  ], function (
    declare, array, Topic, WidgetBase, on,
    domClass, Templated, WidgetsInTemplate,
    Template, AppBase, lang, WorkspaceManager
  ) {
    return declare([AppBase], {
      baseClass: 'geNomad',
      templateString: Template,
      applicationName: 'geNomad name',
      requireAuth: true,
      applicationLabel: 'geNomad label',
      applicationDescription: 'Currently Executes all modules of the geNomad pipeline for plasmid and virus identification from FASTA formatted contigs',
      applicationHelp: 'quick_references/services/genomad.html',
      tutorialLink: 'tutorial/genomad/genomad.html',
      videoLink: 'https://youtube.com/playlist?list=PLWfOyhOW_Oav3zsNKRx_4EMJQjvY7q_U3&si=pg4jREU2MFY_-PBW',
      pageTitle: 'geNomad Service | BV-BRC',
      defaultPath: '',

      constructor: function () {
        // Initialize parameter mapping for form fields
        this.paramToAttachPt = ['input_file', 'output_path', 'output_file'];
      },

      startup: function () {
        var _self = this;
        if (this._started) { return; }
        this.inherited(arguments);
        if (this.requireAuth && (window.App.authorizationToken === null || window.App.authorizationToken === undefined)) {
          return;
        }
        _self.defaultPath = WorkspaceManager.getDefaultFolder() || _self.activeWorkspacePath;
        _self.output_path.set('value', _self.defaultPath);
        this.form_flag = false;
        try {
          this.intakeRerunForm();
        } catch (error) {
          console.error(error);
        }
      },

      openJobsList: function () {
        Topic.publish('/navigate', { href: '/job/' });
      },

      getValues: function () {
        var genomad_values = {};
        var values = this.inherited(arguments);

        // Collect form parameters
        if (!this.form_flag) {
          this.ingestAttachPoints(this.paramToAttachPt, genomad_values, true);
        }

        // Map form values to service parameters
        genomad_values.input_file = values.fasta_file;
        genomad_values.output_path = values.output_path;
        genomad_values.output_file = values.output_file;

        // Set static values for unused parameters as requested
        genomad_values['filtering-preset'] = null; // Default to conservative
        genomad_values.cleanup = true; // Default to true
        genomad_values.restart = true; // Default to true
        genomad_values.verbose = true; // Default to true
        genomad_values['lenient-taxonomy'] = false; // Default to false
        genomad_values['full-ictv-lineage'] = true; // Default to true
        genomad_values.composition = 'auto'; // Default to auto
        genomad_values['force-auto'] = false; // Default to false

        return genomad_values;
      },

      // Helper method to ingest form parameters
      ingestAttachPoints: function (input_pts, target, req) {
        req = typeof req !== 'undefined' ? req : true;
        var success = 1;

        input_pts.forEach(function (attachname) {
          var cur_value = null;
          var incomplete = 0;
          var browser_select = 0;

          if (attachname == 'input_file' || attachname == 'output_path') {
            cur_value = this[attachname].searchBox ? this[attachname].searchBox.value : this[attachname].value;
            browser_select = 1;
          } else {
            cur_value = this[attachname].value;
          }

          if (typeof (cur_value) === 'string') {
            target[attachname] = cur_value.trim();
          } else {
            target[attachname] = cur_value;
          }

          if (req && (!target[attachname] || incomplete)) {
            if (browser_select) {
              this[attachname].searchBox.validate();
              this[attachname].searchBox._set('state', 'Error');
              this[attachname].focus = true;
            }
            success = 0;
          } else {
            if (this[attachname].searchBox) {
              this[attachname].searchBox._set('state', '');
            } else {
              this[attachname]._set('state', '');
            }
          }

          if (target[attachname] != '') {
            target[attachname] = target[attachname] || undefined;
          }
        }, this);

        return success;
      },

      addRerunFields: function (job_params) {
        // Set form values from job parameters
        if (job_params['input_file']) {
          this.fasta_file.set('value', job_params['input_file']);
        }
        if (job_params['output_path']) {
          this.output_path.set('value', job_params['output_path']);
        }
        if (job_params['output_file']) {
          this.output_file.set('value', job_params['output_file']);
        }
      },

      intakeRerunForm: function () {
        // assuming only one key
        var service_fields = window.location.search.replace('?', '');
        var rerun_fields = service_fields.split('=');
        var rerun_key;
        if (rerun_fields.length > 1) {
          rerun_key = rerun_fields[1];
          var sessionStorage = window.sessionStorage;
          if (sessionStorage.hasOwnProperty(rerun_key)) {
            try {
              var param_dict = { 'output_folder': 'output_path' };
              AppBase.prototype.intakeRerunFormBase.call(this, param_dict);
              this.addRerunFields(JSON.parse(sessionStorage.getItem(rerun_key)));
              this.form_flag = true;
            } catch (error) {
              console.log('Error during intakeRerunForm: ', error);
            } finally {
              sessionStorage.removeItem(rerun_key);
            }
          }
        }
      }
    });
  });
