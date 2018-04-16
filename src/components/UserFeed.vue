<template>
  <div class="feed">
    <div>
      <form v-on:submit.prevent="thing" class="thingForm">
  <p style="font-size: 15px;">Item: &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp 
  Price: &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp
	Quantity: &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp
  Frequency:</p>
  <input type="text" v-model="text" placeholder=""/>
  &nbsp &nbsp &nbsp &nbsp $ <input style="width: 50px" type="number" min=1 v-model="price" placeholder=1>
  &nbsp &nbsp &nbsp &nbsp <input style="width: 50px" type="number" min=1 v-model="quantity" placeholder=1>
  &nbsp &nbsp &nbsp &nbsp <input style="width: 50px" type="number" min=1 v-model="frequency" placeholder=1> weeks
	<div class="buttonWrap">
	  <button class="primary" type="submit">Add to Cart</button>
	</div>
      </form>
    </div>
    <div v-for="item in feed" class="item">
      <p class="idline"><span class="user">{{item.thing}}</span><span class="time">Every {{item.frequency}} weeks</span></p>
      <p><span class="time"><button class="primary" v-on:click="remove(item)">Remove from Cart</button></span></p>
      <p class="thing">Price: ${{item.price}}</p>
      <p class="thing">Quantity: {{item.quantity}} <img v-on:click="incrementUp(item)" class="arrow" width="15px" src="../../static/images/arrow.png"></img><img v-on:click="incrementDown(item)"class="arrow" style="transform: rotate(180deg)" width="15px" src="../../static/images/arrow.png"></img></p>
    </div>
  </div>
</template>

<script>
 import moment from 'moment';
 export default {
   name: 'UserFeed',
   data () {
     return {
       text: '',
       price: 1,
       quantity: 1,
       frequency: 1,
       id: '',
       user_id: '',
       totalPrice: 0,
     }
   },
   created: function() {
     this.$store.dispatch('getFeed');
   },
   filters: {
     since: function(datetime) {
       moment.locale('en', {
	 relativeTime: {
	   future: 'in %s',
	   past: '%s',
	   s:  'seconds',
	   ss: '%ss',
	   m:  '1m',
	   mm: '%dm',
	   h:  'h',
	   hh: '%dh',
	   d:  'd',
	   dd: '%dd',
	   M:  ' month',
	   MM: '%dM',
	   y:  'a year',
	   yy: '%dY'
	 }
       });
       return moment(datetime).fromNow();
     },
   },
   computed: {
     feed: function() {
       return this.$store.getters.feed;
     },
   },
   methods: {
     thing: function() {
       //console.log(this.text);
       //console.log(this.price);
       //console.log(this.quantity);
       //console.log(this.frequency);
       this.$store.dispatch('addThing',{
         thing: this.text,
         price: this.price,
         quantity: this.quantity,
         frequency: this.frequency
       }).then(thing => {
	 this.text = "";
   this.price = 1;
   this.quantity = 1;
   this.frequency = 1;
       });
     },
     remove: function(item) {
       //console.log(item);
       this.$store.dispatch('deleteThing',item);
     },
     incrementUp: function(item){
       //console.log(item);
       this.$store.dispatch('incrementUp',item);
     },
     incrementDown: function(item){
       //console.log(item);
       this.$store.dispatch('incrementDown',item);
     }
   }
 }
</script>

<style scoped>
 .feed {
     width: 100%;
     background-color: white;
 }
 .thingForm {
     background: #eee;
     padding: 10px;
     margin-bottom: 10px;
 }
 .buttonWrap {
     width: 100%;
     display: flex;
 }
 button {
     margin-left: auto;
     height: 2em;
     font-size: 0.9em;
 }
 textarea {
     width: 100%;
     height: 3em;
     padding: 2px;
     margin-bottom: 5px;
     resize: none;
     box-sizing: border-box;
 }
 .item {
     border-bottom: 1px solid black;
     padding: 10px;
 }
 .thing {
     margin-top: 0px;
     margin-bottom: 0px;
 }
 .idline {
     margin-bottom: 20px;
 }
 .user {
     font-weight: bold;
     margin-right: 10px;
 }
 .handle {
     margin-right: 10px;
     color: #666;
 }
 .time {
     float: right;
     color: #666;
 }
 .arrow{
      cursor: pointer;
 }
</style>