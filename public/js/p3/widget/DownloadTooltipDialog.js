define([
  'dojo/_base/declare', 'dojo/on', 'dojo/dom-construct',
  'dojo/_base/lang', 'dojo/mouse', 'rql/js-array',
  'dojo/topic', 'dojo/query', 'dijit/layout/ContentPane',
  'dijit/Dialog', 'dijit/popup', 'dijit/TooltipDialog',
  './AdvancedDownload', 'dojo/dom-class', 'FileSaver', 'dojo/when'
], function (
  declare, on, domConstruct,
  lang, Mouse, rql,
  Topic, query, ContentPane,
  Dialog, popup, TooltipDialog,
  AdvancedDownload, domClass, saveAs, when
) {

  return declare([TooltipDialog], {
    containerType: '',
    selection: null,
    grid: null,

    _setSelectionAttr: function (val) {
      // console.log("DownloadTooltipDialog set selection: ", val);
      this.selection = val;
    },

    timeout: function (val) {
      var _self = this;
      this._timer = setTimeout(function () {
        popup.close(_self);
      }, val || 2500);
    },

    onMouseEnter: function () {
      if (this._timer) {
        clearTimeout(this._timer);
      }

      this.inherited(arguments);
    },

    onMouseLeave: function () {
      popup.close(this);
    },

    downloadSelection: function (type, selection) {

      var conf = this.downloadableConfig[this.containerType];
      var dataType, pkField, sortField;
      if ((type == 'dna+fasta' || type == 'protein+fasta') && conf.secondaryDataType && conf.secondartyPK) {
        dataType = conf.secondaryDataType;
        pkField = conf.secondartyPK;
        sortField = (conf.secondarySortField) ? conf.secondarySortField : pkField;
      } else {
        dataType = conf.dataType;
        pkField = conf.pk;
        sortField = conf.sortField || pkField;
      }

      if(conf.selectList){
        selectFields = 'select(' + conf.selectList + ')';
      }
      else{
        selectFields = '';
      }

      var sel;

      // subsystem - take only first item
      if (this.containerType === 'subsystem_data') {
        sel = selection[0][pkField];

      } else {
        sel = selection.map(function (sel) {
          return sel[pkField];
        });
      }

      // console.log('DOWNLOAD TYPE: ', type);
      if (conf.generateDownloadFromStore && this.grid && this.grid.store && type && this['_to' + type]) {
        var query = 'in(' + pkField + ',(' + sel.join(',') + '))&sort(+' + pkField + ')&limit(2500000)';
        when(this.grid.store.query({}), lang.hitch(this, function (results) {

          if (pkField === 'subsystem_id') {
            var data = this['_to' + type.toLowerCase()](selection);
            saveAs(new Blob([data]), 'BVBRC_' + this.containerType + '.' + type);
          } else {
            results = rql.query(query, {}, results);
            var data = this['_to' + type.toLowerCase()](results);
            saveAs(new Blob([data]), 'BVBRC_' + this.containerType + '.' + type);
          }
        }));
      } else {

        var accept;
        switch (type) {
          case 'csv':
          case 'tsv':
            accept = 'text/' + type;
            break;
          case 'excel':
            accept = 'application/vnd.openxmlformats';
            break;
          default:
            accept = 'application/' + type;
            break;
        }

        var baseUrl = (window.App.dataServiceURL ? (window.App.dataServiceURL) : '');

        if (baseUrl.charAt(-1) !== '/') {
          baseUrl += '/';
        }
        baseUrl = baseUrl + dataType + '/';
        var query = 'in(' + pkField + ',(' + sel.join(',') + '))&sort(+' + sortField + ')&limit(2500000)';
        // console.log('Download Query: ', query);

        baseUrl = baseUrl + '?&http_download=true&http_accept=' + accept;

        if (window.App.authorizationToken) {
          baseUrl = baseUrl + '&http_authorization=' + encodeURIComponent(window.App.authorizationToken);
        }

        if (selectFields) {
          query += '&' + selectFields;
        }

        console.log('query is:', query);

        var form = domConstruct.create('form', {
          style: 'display: none;',
          id: 'downloadForm',
          enctype: 'application/x-www-form-urlencoded',
          name: 'downloadForm',
          method: 'post',
          action: baseUrl
        }, this.domNode);
        domConstruct.create('input', { type: 'hidden', value: encodeURIComponent(query), name: 'rql' }, form);
        // Add authorization as form field for POST requests
        if (window.App.authorizationToken) {
          domConstruct.create('input', { type: 'hidden', value: window.App.authorizationToken, name: 'http_authorization' }, form);
        }
        form.submit();
      }
    },

    _tocsv: function (selection) {
      var out = [];
      var keys = Object.keys(selection[0]).filter(function(key) {
        // Skip internal fields and complex objects
        if (key.charAt(0) === '_') return false;
        if (key === 'detail') return false;
        var val = selection[0][key];
        // Skip if value is an object but not an array
        if (val !== null && typeof val === 'object' && !(val instanceof Array)) return false;
        return true;
      });

      var header = [];
      keys.forEach(function (key) {
        header.push(key);
      });
      out.push(header.join(','));
      selection.forEach(function (obj) {
        var io = [];

        keys.forEach(function (key) {
          if (obj[key] instanceof Array) {
            io.push(obj[key].join(';'));
          } else {
            // wrap commas because they are used to delineate new columns
            var cleanedKey;
            if (typeof obj[key] === 'string') {
              cleanedKey = '"' + obj[key] + '"';
            } else {
              cleanedKey = obj[key];
            }
            io.push(cleanedKey);
          }
        });

        out.push(io.join(','));
      });

      return out.join('\n') + '\n';

    },

    _totsv: function (selection) {
      var out = [];
      var keys = Object.keys(selection[0]).filter(function(key) {
        // Skip internal fields and complex objects
        if (key.charAt(0) === '_') return false;
        if (key === 'detail') return false;
        var val = selection[0][key];
        // Skip if value is an object but not an array
        if (val !== null && typeof val === 'object' && !(val instanceof Array)) return false;
        return true;
      });

      var header = [];
      keys.forEach(function (key) {
        header.push(key);
      });
      out.push(header.join('\t'));
      selection.forEach(function (obj) {
        var io = [];

        keys.forEach(function (key) {
          if (obj[key] instanceof Array) {
            io.push(obj[key].join(';'));
          } else {
            io.push(obj[key]);
          }
        });

        out.push(io.join('\t'));
      });

      return out.join('\n') + '\n';

    },

    startup: function () {
      if (this._started) {
        return;
      }
      on(this.domNode, Mouse.enter, lang.hitch(this, 'onMouseEnter'));
      on(this.domNode, Mouse.leave, lang.hitch(this, 'onMouseLeave'));
      var _self = this;
      on(this.domNode, '.wsActionTooltip:click', function (evt) {
        // console.log("evt.target: ", evt.target, evt.target.attributes);
        var rel = evt.target.attributes.rel.value;
        if (rel == 'advancedDownload') {

          // console.log("Selection: ", _self.selection);
          var d = new Dialog({ title: 'Download' });
          var ad = new AdvancedDownload({ selection: _self.selection, containerType: _self.containerType });
          domConstruct.place(ad.domNode, d.containerNode);
          d.show();
          return;
        }
        // var conf = _self.downloadableConfig[_self.containerType];

        // var sel = _self.selection.map(function(sel){
        //   return sel[conf.field || conf.pk]
        // });

        _self.downloadSelection(rel, _self.selection);
      });

      var dstContent = domConstruct.create('div', {});
      this.labelNode = domConstruct.create('div', { style: 'background:#09456f;color:#fff;margin:0px;margin-bottom:4px;padding:4px;text-align:center;' }, dstContent);
      this.selectedCount = domConstruct.create('div', {}, dstContent);
      var table = domConstruct.create('table', {}, dstContent);

      var tr = domConstruct.create('tr', {}, table);
      var tData = this.tableDownloadsNode = domConstruct.create('td', { style: 'vertical-align:top;' }, tr);
      // spacer
      domConstruct.create('td', { style: 'width:10px;' }, tr);
      this.otherDownloadNode = domConstruct.create('td', { style: 'vertical-align:top;' }, tr);

      domConstruct.create('div', { 'class': 'wsActionTooltip', rel: 'tsv', innerHTML: 'Text' }, tData);
      domConstruct.create('div', { 'class': 'wsActionTooltip', rel: 'csv', innerHTML: 'CSV' }, tData);
      // domConstruct.create("div", {"class": "wsActionTooltip", rel: "excel", innerHTML: "Excel"}, tData);

      if (this.isGenomeOverview) {
        const conf = this.downloadableConfig[this.containerType] || this.downloadableConfig['default'];
        if (conf && conf.otherData) {
          conf.otherData.forEach(function (type) {
            domConstruct.create('div', {
              'class': 'wsActionTooltip',
              rel: type,
              innerHTML: this.downloadableDataTypes[type]
            }, this.otherDownloadNode);
          }, this);
        }
      } else {
        tr = domConstruct.create('tr', {}, table);
        var td = domConstruct.create('td', {colspan: 3, style: 'text-align:right'}, tr);
        this.advancedDownloadButton = domConstruct.create('span', {
          'class': 'wsActionTooltip',
          style: 'padding:4px;',
          rel: 'advancedDownload',
          innerHTML: 'More Options'
        }, td);
      }

      this.set('content', dstContent);

      this._started = true;
      this.set('label', this.label);
      this.set('selection', this.selection);

    },

    _setLabelAttr: function (val) {
      this.label = val;
      if (this._started) {
        this.labelNode.innerHTML = this.isGenomeOverview ? 'Download options' : 'Download selected ' + val + ' (' + (this.selection ? this.selection.length : '0') + ') as...';
      }
    },

    downloadableDataTypes: {
      'dna+fasta': 'DNA FASTA',
      'protein+fasta': 'Protein FASTA'
    },

    downloadableConfig: {
      genome_data: {
        label: 'Genomes',
        dataType: 'genome',
        pk: 'genome_id',
        tableData: true,
        otherData: ['dna+fasta'],
        secondaryDataType: 'genome_sequence',
        secondartyPK: 'genome_id',
        secondarySortField: 'sequence_id',
        advanced: false
      },
      sequence_data: {
        label: 'Sequences',
        dataType: 'genome_sequence',
        pk: 'sequence_id',
        tableData: true,
        otherData: ['dna+fasta'],
        generateDownloadFromStore: true,
        selectList: 'genome_id,genome_name,sequence_id,gi,accession,sequence_type,topology,description,gc_content,length,release_date,version,date_inserted'
      },
      sequence_feature_data: {
        label: 'Sequence Features',
        dataType: 'sequence_feature',
        pk: 'id',
        tableData: true
      },
      feature_data: {
        label: 'Features',
        dataType: 'genome_feature',
        pk: 'feature_id',
        tableData: true,
        otherData: ['dna+fasta', 'protein+fasta'],
        generateDownloadFromStore: true,
        selectList: 'genome_name,genome_id,accession,brc_id,refseq_locus_tag,feature_id,annotation,feature_type,start,end,strand,figfam_id,plfam_id,pgfam_id,protein_id,aa_length,gene,product,go,date_inserted'
      },
      protein_data: {
        label: 'Proteins',
        dataType: 'genome_feature',
        pk: 'feature_id',
        tableData: true,
        otherData: ['protein+fasta']
      },
      structure_data: {
        label: 'Protein Structure',
        dataType: 'protein_structure',
        pk: 'pdb_id',
        tableData: true,
        selectList: 'pdb_id,title,organism_name,taxon_id,genome_id,patric_id,uniprotkb_accession,gene,product,sequence_md5,sequence,alignments,method,resolution,pmid,institution,authors,release_date,date_inserted'
      },
      spgene_data: {
        dataType: 'sp_gene',
        pk: 'id',
        label: 'Specialty Genes',
        tableData: true,
        otherData: ['dna+fasta', 'protein+fasta'],
        // FASTA data does not exist in sp_gene table, use genome_feature table instead
        // set secondaryDataType & secondartyPK to allow download from a second table
        secondaryDataType: 'genome_feature',
        secondartyPK: 'feature_id'
      },
      specialty_genes: {
        label: 'Specialty Genes',
        pk: '_id',
        generateDownloadFromStore: true,
        tableData: true
      },
      fasta_data: {
        label: 'FASTA Results',
        pk: '_id',
        generateDownloadFromStore: true,
        tableData: true
      },
      spgene_ref_data: {
        dataType: 'sp_gene_ref',
        pk: 'id',
        label: 'Specialty VF Genes',
        tableData: true
      },
      proteinFeatures_data: {
        label: 'Domains and Motifs',
        dataType: 'protein_feature',
        pk: 'id',
        tableData: true,
        selectList: 'id,genome_id,genome_name,taxon_id,feature_id,patric_id,refseq_locus_tag,aa_sequence_md5,gene,product,interpro_id,interpro_description,feature_type,source,source_id,description,classification,score,e_value,evidence,publication,start,end,segments,length,sequence,comments,date_inserted'
      },
      epitope_data: {
        label: 'Epitopes',
        dataType: 'epitope',
        pk: 'epitope_id',
        tableData: true,
        selectList: 'epitope_id,epitope_type,epitope_sequence,organism,taxon_id,protein_name,protein_id,protein_accession,start,end,total_assays,bcell_assays,tcell_assays,mhc_assays,comments,date_inserted'
      },
      surveillance_data: {
        label: 'Surveillance',
        dataType: 'surveillance',
        pk: 'id',
        tableData: true,
        selectList: 'project_identifier,contributing_institution,sample_identifier,sequence_accession,sample_material,sample_transport_medium,sample_receipt_date,submission_date,last_update_date,longitudinal_study,embargo_end_date,collector_name,collector_institution,contact_email_address,collection_date,collection_year,collection_season,days_elapsed_to_sample_collection,collection_country,collection_state_province,collection_city,collection_poi,collection_latitude,collection_longitude,pathogen_test_type,pathogen_test_result,pathogen_test_interpretation,species,pathogen_type,subtype,strain,host_identifier,host_id_type,host_species,host_common_name,host_group,host_sex,host_age,host_height,host_weight,host_habitat,host_natural_state,host_capture_status,host_health,exposure,duration_of_exposure,exposure_type,use_of_personal_protective_equipment,primary_living_situation,nursing_home_residencedaycare_attendance,travel_history,profession,education,pregnancy,trimester_of_pregnancy,breastfeeding,hospitalized,hospitalization_duration,intensive_care_unit,chest_imaging_interpretation,ventilation,oxygen_saturation,ecmo,dialysis,disease_status,days_elapsed_to_disease_status,disease_severity,alcohol_or_other_drug_dependence,tobacco_use,packs_per_day_for_how_many_years,chronic_conditions,maintenance_medication,types_of_allergies,influenza_like_illness_over_the_past_year,infections_within_five_years,human_leukocyte_antigens,symptoms,onset_hours,sudden_onset,diagnosis,pre_visit_medication,post_visit_medication,treatment,initiation_of_treatment,duration_of_treatment,treatment_dosage,vaccination_type,days_elapsed_to_vaccination,source_of_vaccine_information,vaccine_lot_number,vaccine_manufacturer,vaccine_dosage,other_vaccinations,additional_metadata,comments,date_inserted'
      },
      serology_data: {
        label: 'Serology',
        dataType: 'serology',
        pk: 'id',
        tableData: true,
        selectList: 'project_identifier,contributing_institution,sample_identifier,host_identifier,host_type,host_species,host_common_name,host_sex,host_age,host_age_group,host_health,collection_country,collection_state,collection_city,collection_date,collection_year,test_type,test_result,test_interpretation,serotype,comments,date_inserted'
      },
      pathway_data: {
        pk: 'pathway_id',
        dataType: 'pathway',
        label: 'Pathways',
        generateDownloadFromStore: true,
        tableData: true
      },
      subsystem_data: {
        pk: 'feature_id',
        dataType: 'subsystem',
        label: 'Subsystem',
        generateDownloadFromStore: true,
        tableData: true
      },
      gene_expression_data: {
        dataType: 'transcriptomics_gene',
        pk: 'id',
        label: 'Gene Expression',
        tableData: true
      },
      transcriptomics_gene_data: {
        dataType: 'genome_feature',
        pk: 'feature_id',
        label: 'Features',
        tableData: true
      },
      transcriptomics_experiment_data: {
        dataType: 'transcriptomics_experiment',
        pk: 'eid',
        label: 'Experiments',
        tableData: true
      },
      transcriptomics_sample_data: {
        dataType: 'transcriptomics_sample',
        pk: 'pid',
        label: 'Comparisons',
        tableData: true
      },
      experiment_data: {
        dataType: 'experiment',
        pk: 'exp_id',
        label: 'Experiments',
        tableData: true,
        selectList: 'exp_id,study_name,study_title,exp_name,exp_title,public_identifier,exp_type,biosets,organism,strain,treatment_type,treatment_name,treatment_amount,treatment_duration,date_inserted'
      },
      bioset_data: {
        dataType: 'bioset',
        pk: 'bioset_id',
        label: 'Biosets',
        tableData: true,
        selectList: 'bioset_id,exp_id,study_name,exp_name,exp_title,exp_type,bioset_name,bioset_description,bioset_type,organism,strain,treatment_type,treatment_name,treatment_amount,treatment_duration,entity_count,date_inserted'
      },
      interaction_data: {
        dataType: 'ppi',
        pk: 'id',
        label: 'Interactions',
        tableData: true
      },
      genome_amr_data: {
        dataType: 'genome_amr',
        pk: 'id',
        label: 'AMR Phenotypes',
        tableData: true
      },
      'default': {
        label: 'Items',
        tableData: true
      }
    },

    _setContainerTypeAttr: function (val) {
      // console.log("setContainerType: ", val);
      this.containerType = val;

      var conf = this.downloadableConfig[val] || this.downloadableConfig['default'];

      this.set('label', conf.label);

      if (!this._started) {
        return;
      }

      domConstruct.empty(this.otherDownloadNode);

      if (conf.otherData) {
        conf.otherData.forEach(function (type) {
          domConstruct.create('div', {
            'class': 'wsActionTooltip',
            rel: type,
            innerHTML: this.downloadableDataTypes[type]
          }, this.otherDownloadNode);
        }, this);
      }

      if (conf.advanced) {
        domClass.remove(this.advancedDownloadButton, 'dijitHidden');
      } else {
        domClass.add(this.advancedDownloadButton, 'dijitHidden');
      }

    }
  });

});
