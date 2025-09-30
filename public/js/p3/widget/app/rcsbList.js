define(["dojo/request"], function(request) {
  return {
    getEntryIds: function() {
      // Returns a Promise that resolves with the list of valid PDB IDs
      return request.get("https://data.rcsb.org/rest/v1/holdings/current/entry_ids", {
        handleAs: "json"
      });
    }
  };
});
