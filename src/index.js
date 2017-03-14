import {Socket} from "./phoenix";

import Emitter from './Emitter'

const VueChannel = {

    install(Vue, url, params, store){

        if(!url) throw new Error("[VueChannel] Cannot connect to an empty URL")

        // let observer = new Observer(connection, params, store)

        let socket = new Socket(url, {params: params});

        Vue.prototype.$socket = socket;
        
        Vue.mixin({
            created(){

                this.$socket.connect();

                let channels = this.$options['channels']
                
                this.$options.channels = new Proxy({}, {
                    set: (target, key, value) => {
                        // Emitter.addListener(key, value, this)
                        
                        let chan = this.$socket.channel(key, {});
                        let _chan = chan.join();

                        if(value.onError) {
                            chan.onError = value.onError;
                        }

                        if(value.onClose) {
                            chan.onClose = value.onClose;
                        }
                        
                        if(value.onJoin) {
                            _chan.receive('ok', value.onJoin);
                        }
                        
                        if(value.onMessage) {
                            chan.onMessage = function(event, payload, res) {
                                value.onMessage(event, payload, res)
                                return payload;
                            }
                        }
                        
                        target[key] = chan;
                        return true;
                    },
                    deleteProperty: (target, key) => {
                        // Emitter.removeListener(key, this.$options.channels[key], this)
                        delete target.key;
                        return true
                    }
                })

                if(channels){
                    Object.keys(channels).forEach((key) => {
                        this.$options.channels[key] = channels[key];
                    });
                }
            },
            beforeDestroy(){
                let channels = this.$options['channels']

                if(channels){
                    Object.keys(channels).forEach((key) => {
                        console.log("Bye", key);
                        this.$options.channels[key].leave();
                        delete this.$options.channels[key]
                    });
                }
            }
        })

    }

}

export default VueChannel;