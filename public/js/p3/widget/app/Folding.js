define([
    'dojo/_base/declare', 'dojo/_base/lang', 'dojo/_base/Deferred',
    'dojo/on', 'dojo/query', 'dojo/dom-class', 'dojo/dom-construct', 'dojo/dom-style', 'dojo/topic',
    './AppBase',
    'dojo/text!./templates/Folding.html', 'dijit/form/Form',
    '../../util/PathJoin', '../../WorkspaceManager', '../WorkspaceObjectSelector', '../../DataAPI'
  ], function (
    declare, lang, Deferred,
    on, query, domClass, domConstruct, domStyle, Topic,
    AppBase,
    Template, FormMixin, PathJoin, WorkspaceManager, WorkspaceObjectSelector, DataAPI
  ) {

    return declare([AppBase], {
      baseClass: 'Folding',
      templateString: Template,
      applicationName: 'Folding',
      requireAuth: true,
      applicationLabel: 'Folding',
      applicationDescription: 'Folding combines multiple sequence alignment and structure prediction (AlphaFold, ESMFold, and ???) to predict the 3D structure of a protein.',
      applicationHelp: 'quick_references/services/folding.html',
      tutorialLink: 'tutorial/folding/folding.html',
      videoLink: 'https://youtu.be/PJ9vdCnozMg',
      pageTitle: 'Folding Service | BV-BRC',
      defaultPath: '',

    constructor: function () {
      this.paramToAttachPt = ['output_path', 'input_sequences', 'model_preset', 'db_preset', 'output_file', 'num_recycles', 'chunk_size', 'max_sequence_length', 'max_tokens_per_batch', 'batch_sequences'];
      this.currentFoldingType = 'alphafold';
    },

      startup: function () {
        if (this._started) { return; }
        if (this.requireAuth && (window.App.authorizationToken === null || window.App.authorizationToken === undefined)) {
          return;
        }
        this.inherited(arguments);

        // Set default path
        if (window.App.user) {
          this.defaultPath = WorkspaceManager.getDefaultFolder() || this.activeWorkspacePath;
          this.output_path.set('value', this.defaultPath);
        }

        // Initialize folding type selection
        this.foldingTypeAlphaFold.set('checked', true);
        this.onFoldingTypeChange();

        this.form_flag = false;
        try {
          this.intakeRerunForm();
          if (this.form_flag) {
            this.output_file.focus();
          }
        } catch (error) {
          console.error(error);
        }

        this._started = true;
      },

      openJobsList: function () {
        Topic.publish('/navigate', { href: '/job/' });
      },

      onFoldingTypeChange: function () {
        if (this.foldingTypeAlphaFold.get('checked')) {
          this.currentFoldingType = 'alphafold';
          this.alphafoldParamsBox.style.display = 'block';
          this.esmfoldParamsBox.style.display = 'none';
        } else if (this.foldingTypeESMFold.get('checked')) {
          this.currentFoldingType = 'esmfold';
          this.alphafoldParamsBox.style.display = 'none';
          this.esmfoldParamsBox.style.display = 'block';
          }
        this.input_sequences.set('required', true);
        this.validate();
      },

      validate: function () {
        var valid = this.inherited(arguments);
        if (valid) {
          var val = true;

          // Validate output path
          if (!this.output_path.get('value')) {
            val = false;
          }

          // Validate output file name
          if (!this.output_file.get('value')) {
            val = false;
          }

          if (!this.input_sequences.get('value')) {
            val = false;
          }

          if (val) {
            this.submitButton.set('disabled', false);
            return true;
          }
        }
        this.submitButton.set('disabled', true);
        return false;
      },

      onChangeModelPreset: function (val) {
        // Handle model preset changes if needed
        this.validate();
      },

      onChangeDatabasePreset: function (val) {
        // Handle database preset changes if needed
        this.validate();
      },

      onNumRecyclesChange: function (val) {
        // Handle number of recycles changes if needed
        this.validate();
      },

      onChunkSizeChange: function (val) {
        // Handle chunk size changes if needed
        this.validate();
      },

      onMaxSequenceLengthChange: function (val) {
        // Handle max sequence length changes if needed
        this.validate();
      },

      onMaxTokensPerBatchChange: function (val) {
        // Handle max tokens per batch changes if needed
        this.validate();
      },

      onBatchSequencesChange: function (val) {
        // Handle batch processing toggle
        if (val) {
          this.max_tokens_per_batch.set('disabled', false);
        } else {
          this.max_tokens_per_batch.set('disabled', true);
        }
        this.validate();
      },

      // onUseGpuChange: function (val) {
      //   // Handle GPU usage toggle
      //   this.validate();
      // },

      // onCpuOffloadChange: function (val) {
      //   // Handle CPU offloading toggle
      //   this.validate();
      // },

      onOutputPathChange: function (val) {
        this.inherited(arguments);
        this.validate();
      },

      checkOutputName: function () {
        this.inherited(arguments);
        this.validate();
      },

      // setLiveJob: function () {
      //   this.live_job.value = this.live_job.checked;
      // },

      getValues: function () {
        var folding_values = {};
        var values = this.inherited(arguments);
        console.log('values', values);

        // Common values
        folding_values.output_path = values.output_path;
        folding_values.output_file = values.output_file;
        folding_values.folding_type = this.currentFoldingType;

        if (this.currentFoldingType === 'alphafold') {
          // AlphaFold-specific values
          folding_values.fasta_paths = values.input_sequences;
          folding_values.output_dir = '/output';
          folding_values.model_preset = values.model_preset;
          folding_values.data_dir = '/databases';
          folding_values.db_preset = values.db_preset;
        } else if (this.currentFoldingType === 'esmfold') {
          // ESMFold-specific values
          folding_values.sequences = values.input_sequences;
          folding_values.output_file_basename = values.output_file;
          folding_values.num_recycles = values.num_recycles;
          folding_values.chunk_size = values.chunk_size;
          folding_values.max_sequence_length = values.max_sequence_length;

          // Convert checkbox arrays to boolean values
          folding_values.batch_sequences = Array.isArray(values.batch_sequences) ? values.batch_sequences.length > 0 : values.batch_sequences;
          folding_values.max_tokens_per_batch = values.max_tokens_per_batch;
          folding_values.use_gpu = true;
          folding_values.cpu_offload = false;
        }

        return folding_values;
      },

      onReset: function (evt) {
        this.inherited(arguments);
        // Reset any additional fields specific to AlphaFold
      },

      addRerunFields: function (job_params) {
        // Set folding type
        if (job_params.folding_type) {
          if (job_params.folding_type === 'alphafold') {
            this.foldingTypeAlphaFold.set('checked', true);
            this.foldingTypeESMFold.set('checked', false);
          } else if (job_params.folding_type === 'esmfold') {
            this.foldingTypeAlphaFold.set('checked', false);
            this.foldingTypeESMFold.set('checked', true);
          }
          this.onFoldingTypeChange();
        }

        // Set common fields
        if (job_params.output_path) {
          this.output_path.set('value', job_params.output_path);
        }

        if (job_params.output_file) {
          this.output_file.set('value', job_params.output_file);
        }

        // Set AlphaFold-specific fields
        if (job_params.fasta_paths) {
          this.fasta_paths.set('value', job_params.fasta_paths);
        }

        if (job_params.model_preset) {
          this.model_preset.set('value', job_params.model_preset);
        }

        if (job_params.db_preset) {
          this.db_preset.set('value', job_params.db_preset);
        }

        // Set ESMFold-specific fields
        if (job_params.sequences) {
          this.sequences.set('value', job_params.sequences);
        }

        if (job_params.output_file_basename) {
          this.output_file.set('value', job_params.output_file_basename);
        }

        if (job_params.num_recycles) {
          this.num_recycles.set('value', job_params.num_recycles);
        }

        if (job_params.chunk_size) {
          this.chunk_size.set('value', job_params.chunk_size);
        }

        if (job_params.max_sequence_length) {
          this.max_sequence_length.set('value', job_params.max_sequence_length);
        }

        if (job_params.batch_sequences !== undefined) {
          this.batch_sequences.set('checked', Boolean(job_params.batch_sequences));
        }

        if (job_params.max_tokens_per_batch) {
          this.max_tokens_per_batch.set('value', job_params.max_tokens_per_batch);
        }

        // if (job_params.use_gpu !== undefined) {
        //   this.use_gpu.set('checked', Boolean(job_params.use_gpu));
        // }

        // if (job_params.cpu_offload !== undefined) {
        //   this.cpu_offload.set('checked', Boolean(job_params.cpu_offload));
        // }
      },

      intakeRerunForm: function () {
        // Handle form rerun from session storage
        var service_fields = window.location.search.replace('?', '');
        var rerun_fields = service_fields.split('=');
        var rerun_key;

        if (rerun_fields.length > 1) {
          try {
            rerun_key = rerun_fields[1];
            var sessionStorage = window.sessionStorage;
            if (sessionStorage.hasOwnProperty(rerun_key)) {
              var param_dict = { 'output_folder': 'output_path' };
              AppBase.prototype.intakeRerunFormBase.call(this, param_dict);
              this.addRerunFields(JSON.parse(sessionStorage.getItem(rerun_key)));
              this.form_flag = true;
            }
          } catch (error) {
            console.log('Error during intakeRerunForm: ', error);
          } finally {
            if (rerun_key) {
              sessionStorage.removeItem(rerun_key);
            }
          }
        }
      }
    });
  });