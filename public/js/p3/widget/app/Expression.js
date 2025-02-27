define([
  'dojo/_base/declare', 'dijit/_WidgetBase', 'dojo/on', 'dojo/_base/lang',
  'dojo/dom-class', 'dijit/_TemplatedMixin', 'dijit/_WidgetsInTemplateMixin',
  'dojo/text!./templates/Expression.html', './AppBase', 'p3/widget/WorkspaceFilenameValidationTextBox', '../../WorkspaceManager',
  '../../DataAPI'
], function (
  declare, WidgetBase, on, lang,
  domClass, Templated, WidgetsInTemplate,
  Template, AppBase, WorkspaceFilenameValidationTextBox, WorkspaceManager, DataAPI
) {
  return declare([AppBase], {
    baseClass: 'Expression',
    templateString: Template,
    applicationName: 'DifferentialExpression',
    requireAuth: true,
    applicationLabel: 'Expression Import',
    applicationDescription: 'The Expression Import Service facilitates upload of user-provided, pre-processed differential expression datasets generated by microarray, RNA-Seq, or proteomic technologies to the user\'s private workspace.',
    applicationHelp: 'quick_references/services/expression_data_import_service.html',
    tutorialLink: 'tutorial/expression_import/expression_import.html',
    videoLink: 'https://youtu.be/6MZUq42jx78',
    pageTitle: 'Expression Import Service | DXKB',
    defaultPath: '',
    constructor: function () {
      this._selfSet = true;
    },
    startup: function () {
      var _self = this;
      if (this._started) {
        return;
      }
      if (this.requireAuth && (window.App.authorizationToken === null || window.App.authorizationToken === undefined)) {
        return;
      }
      this.inherited(arguments);
      _self.defaultPath = WorkspaceManager.getDefaultFolder('experiment_folder') || _self.activeWorkspacePath;
      _self.output_pathWidget.set('value', _self.defaultPath);
      this._started = true;
      this.form_flag = false;
      try {
        this.intakeRerunForm();
      } catch (error) {
        console.error(error);
      }
    },
    getValues: function () {
      var values = this.inherited(arguments);
      var exp_values = {};
      var ustring_keys = ['xformat', 'source_id_type', 'data_type', 'experiment_title', 'experiment_description', 'organism', 'metadata_format', 'genome_id', 'pmid'];
      var ustring = {};
      ustring_keys.forEach(function (k) {
        ustring[k] = values[k];
      });
      // get xsetup from object type
      ustring.xsetup = this.xfile.searchBox.get('item').type == 'expression_gene_matrix' ? 'gene_matrix' : 'gene_list'; // should be this.xfile.get("selection").type but need to fix on quick drop
      ustring.organism = this.scientific_nameWidget.get('displayedValue');
      ustring.host = false;
      if (values.host == 'true') {
        ustring.host = true;
      }
      exp_values.ustring = JSON.stringify(ustring);
      exp_values.xfile = values.xfile;
      exp_values.mfile = values.mfile;
      exp_values = this.checkBaseParameters(values, exp_values);

      return exp_values;
    },

    checkBaseParameters: function (values, exp_values) {
      exp_values.output_path = values.output_path;
      this.output_folder = values.output_path;
      exp_values.output_file = values.experiment_title;
      this.output_name = values.experiment_title;
      return exp_values;
    },

    intakeRerunForm: function () {
      var service_fields = window.location.search.replace('?', '');
      var rerun_fields = service_fields.split('=');
      var rerun_key;
      if (rerun_fields.length > 1) {
        try {
          rerun_key = rerun_fields[1];
          var sessionStorage = window.sessionStorage;
          if (sessionStorage.hasOwnProperty(rerun_key)) {
            var param_dict = { 'output_folder': 'output_path' };
            var service_specific = {  };
            param_dict['service_specific'] = service_specific;
            var job_data = JSON.parse(sessionStorage.getItem(rerun_key));
            this.addUstringParametersFormFill(job_data);
            // AppBase.prototype.intakeRerunFormBase.call(this, param_dict);
            // console.log(job_data);
            this.form_flag = true;
          }
        } catch (error) {
          console.log('Error during intakeRerunForm: ', error);
        } finally {
          sessionStorage.removeItem(rerun_key);
        }

      }
    },

    addUstringParametersFormFill: function (job_data) {
      if (job_data.hasOwnProperty('ustring')) {
        var ustring_data = JSON.parse(job_data['ustring']);
        ustring_data['xfile'] = job_data['xfile'];
        // It did not like adding "organism":"scientific_nameWidget"
        var widget_map = {
          'xfile': 'xfile',
          'data_type': 'data_type',
          'experiment_description': 'experiment_description',
          // 'organism': 'scientific_nameWidget',
          // 'genome_id': 'genome_nameWidget',
          'source_id_type': 'source_id_type',
          'pmid': 'pmid'
        };
        Object.keys(ustring_data).forEach(function (field) {
          if (!widget_map.hasOwnProperty(field)) { return; }
          if (!this[widget_map[field]]) {
            console.log('attach_point does not exist:', field);
            return;
          }
          this[widget_map[field]].set('value', ustring_data[field]);
        }, this);
        if (ustring_data['genome_id'] !== '') {
          this.genome_nameWidget.set('value', ustring_data['genome_id']);
        }
      }
      if (job_data.hasOwnProperty('mfile') && job_data['mfile'] !== '') {
        this.mfile.set('value', job_data['mfile']);
      }
      if (ustring_data.hasOwnProperty('host')) {
        this.host.set('value', job_data['host']);
      }
    }
  });
});
