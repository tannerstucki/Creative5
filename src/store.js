import Vue from 'vue';
import Vuex from 'vuex';

import axios from 'axios';

Vue.use(Vuex);

const getAuthHeader = () => {
   return { headers: {'Authorization': localStorage.getItem('token')}};
}

export default new Vuex.Store({
  state: {
    user: {},
    //loggedIn: false,
    token: '',
    loginError: '',
    registerError: '',
    feed: [],
  },
  getters: {
    user: state => state.user,
    //loggedIn: state => state.loggedIn,
    getToken: state => state.token,
    loggedIn: state => {
      if (state.token === '')
       return false;
      return true;
    },
    loginError: state => state.loginError,
    registerError: state => state.registerError,
    feed: state => state.feed,
  },
  mutations: {
    setUser (state, user) {
      state.user = user;
    },
    setLogin (state, status) {
      state.loggedIn = status;
    },
    setToken (state, token) {
      state.token = token;
    if (token === '')
	    localStorage.removeItem('token');
    else
	    localStorage.setItem('token', token)
    },
    setLoginError (state, message) {
      state.loginError = message;
    },
    setRegisterError (state, message) {
      state.registerError = message;
    },
    setFeed (state, feed) {
      state.feed = feed;
    },
  },
  actions: {
    // Initialize //
    initialize(context) {
      let token = localStorage.getItem('token');
      if(token) {
       // see if we can use the token to get my user account
      axios.get("/api/me",getAuthHeader()).then(response => {
         context.commit('setToken',token);
         context.commit('setUser',response.data.user);
       }).catch(err => {
         // remove token and user from state
         localStorage.removeItem('token');
         context.commit('setUser',{}); 
         context.commit('setToken','');
       });
      }
    },
    // Registration, Login //
    register(context,user) {
      return axios.post("/api/users",user).then(response => {
        context.commit('setUser', response.data.user);
        //context.commit('setLogin',true);
        context.commit('setToken',response.data.token);
        context.commit('setRegisterError',"");
        context.commit('setLoginError',"");
            }).catch(error => {
        //context.commit('setLogin',false);
        context.commit('setUser',{});   
        context.commit('setToken','');
        context.commit('setLoginError',"");
	if (error.response) {
	  if (error.response.status === 403)
	    context.commit('setRegisterError',"That email address already has an account.");
	  else if (error.response.status === 409)
	    context.commit('setRegisterError',"That user name is already taken.");
	  return;
	}
	context.commit('setRegisterError',"Sorry, your request failed. We will look into it.");
      });
    },
    login(context,user) {
      axios.post("/api/login",user).then(response => {
	context.commit('setUser', response.data.user);
	//context.commit('setLogin',true);
  context.commit('setToken',response.data.token);
	context.commit('setRegisterError',"");
	context.commit('setLoginError',"");
      }).catch(error => {
  context.commit('setUser',{});
  context.commit('setToken','');      
	context.commit('setRegisterError',"");
	if (error.response) {
	  if (error.response.status === 403 || error.response.status === 400)
	    context.commit('setLoginError',"Invalid login.");
	  context.commit('setRegisterError',"");
	  return;
	}
	context.commit('setLoginError',"Sorry, your request failed. We will look into it.");
      });
    },
    logout(context,user) {
      context.commit('setUser', {});
      //context.commit('setLogin',false);
      context.commit('setToken','');
    },
    // Get things //
    getFeed(context) {
      axios.get("/api/users/" + context.state.user.id + "/things").then(response => {
	    context.commit('setFeed',response.data.things);
      //console.log(response.data.things);
      }).catch(err => {
	console.log("getFeed failed:",err);
      });
    },
    addThing(context,thing) {
      //console.log(thing);
      //console.log(thing.frequency);
      //axios.post("/api/users/" + context.state.user.id + "/things", thing).then(response => {
        axios.post("/api/users/" + context.state.user.id + "/things",thing,getAuthHeader()).then(response => {
	return context.dispatch('getFeed');
      }).catch(err => {
	console.log("addThing failed:",err);
      });
    },
    deleteThing(context,thing){
      //console.log(thing);
      //console.log(thing.id);
      //console.log(temp);
      //console.log(thing.created);
      //return axios.delete("/api/users/" + context.state.user.id + "/things/" + thing.id, thing).then(response => {
      return axios.delete("/api/users/" + context.state.user.id + "/things/" + thing.id,getAuthHeader()).then(response => {
      context.dispatch('getFeed');
      }).catch(err => {
        console.log("deleteThing failed:",err);
      });
    },
    incrementUp(context,thing){
      //console.log(thing.id);
      thing.quantity = thing.quantity + 1;
      return axios.put("/api/users/" + context.state.user.id + "/things/" + thing.id, thing).then(response => {
        context.dispatch('getFeed');
      }).catch(err => {
        console.log("incrementUp in store failed: ", err);
      });
    },
    incrementDown(context,thing){
      //console.log(thing.id);
      thing.quantity = thing.quantity - 1;
      return axios.put("/api/users/" + context.state.user.id + "/things/" + thing.id, thing).then(response => {
        context.dispatch('getFeed');
      }).catch(err => {
        console.log("incrementUp in store failed: ", err);
      });
    }
  }
});