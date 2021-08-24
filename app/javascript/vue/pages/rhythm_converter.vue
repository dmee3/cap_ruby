<template>
  <div>
    <div class="row">
      <div class="col-12 col-md-6">
        <div class="card">
          <div class="card-body">
            <h4 class="card-title">Original Rhythm</h4>
            <div class="col-12 form-group">
              <label for="original-rhythm">Original Rhythm</label>
              <select id="original-rhythm" v-model="originalRhythm" class="form-control" name="original-rhythm">
                <option v-for="rhythm in rhythms" :key="rhythm.value" :value="rhythm.value">
                  {{ rhythm.text }}
                </option>
              </select>
            </div>

            <div class="col-12 form-group">
              <label for="original-tempo">Original Tempo</label>
              <input id="original-tempo" v-model="originalTempo" class="form-control" name="original-tempo"  type="text">
            </div>            
          </div>
        </div>
      </div>

      <div  class="col-12 col-md-6">
        <div class="card">
          <div class="card-body">
            <h4 class="card-title">New Rhythm</h4>

            <div class="col-12 form-group">
              <label for="original-rhythm">New Rhythm</label>
              <select id="original-rhythm" v-model="newRhythm" class="form-control" name="original-rhythm">
                <option v-for="rhythm in rhythms" :key="rhythm.value" :value="rhythm.value">
                  {{ rhythm.text }}
                </option>
              </select>
            </div>

            <div class="col-12 form-group">
              <label for="new-tempo">New Tempo</label>
              <input id="new-tempo" v-model="newTempo" class="form-control" name="new-tempo"  type="text" disabled>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

export default {
  data: () => ({
    originalTempo: 100,
    originalRhythm: 4,
    newRhythm: 8,
    rhythms: [
      { text: 'Quarter Note', value: 4 },
      { text: 'Quarter Note Fivelet', value: 5 },
      { text: 'Quarter Note Triplet', value: 6 },
      { text: 'Eighth Note', value: 8 },
      { text: 'Eighth Note Fivelet', value: 10 },
      { text: 'Eighth Note Triplet', value: 12 },
      { text: 'Sixteenth Note', value: 16 },
      { text: 'Sixteenth Note Fivelet', value: 20 },
      { text: 'Sixteenth Note Triplet', value: 24 },
    ]
  }),
  computed: {
    newTempo: function() {
      return parseInt(this.originalTempo) * (this.originalRhythm / this.newRhythm)
    },
  },
}
</script>
