// person.js

'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const venom = require('venom-bot');
const wppconnect = require('@wppconnect-team/wppconnect');
const axios = require('axios');
const fetch = require("node-fetch"); 
const ytdl = require('ytdl-core');
const ffmpeg = require('ffmpeg'); 
const { decryptMedia } = require('@open-wa/wa-decrypt');
const fs1 = require('fs-extra');
const moment = require('moment-timezone');
const get = require('got');
const akaneko = require('akaneko');;
const { exec } = require('child_process');
const bent = require('bent');
const mime = require('mime-types');
const atob = require('atob');
const util = require("util");
const gify = require("gify");
const ffmpegf = require('fluent-ffmpeg');
const Client = require('brainly-client');
const { htmlToText } = require('html-to-text');
const correios = require('correios-rastreamento');
const weather = require('weather-api-data');
//INSTALAR FFmpeg apt install ffmpeg
const YoutubeMp3Downloader = require("youtube-mp3-downloader");
//INSTALAR O CHROME PRA LINUX: https://www.edivaldobrito.com.br/como-instalar-o-google-chrome-no-ubuntu-20-04-via-repositorio-oficial/
//MUDAR ENGINE PRO WPPCONNECT
//ATUALIZAR PUPPETER npm i puppeteer



module.exports = class Sessions {

    static async start(sessionName, options = []) {
        Sessions.options = Sessions.options || options; //start object
        Sessions.sessions = Sessions.sessions || []; //start array

        var session = Sessions.getSession(sessionName);

        if (session == false) { //create new session
            console.log("session == false");
            session = await Sessions.addSesssion(sessionName);
        } else if (["CLOSED"].includes(session.state)) { //restart session
            console.log("session.state == CLOSED");
            session.state = "STARTING";
            session.status = 'notLogged';
            session.client = Sessions.initSession(sessionName);
            Sessions.setup(sessionName);
        } else if (["CONFLICT", "UNPAIRED", "UNLAUNCHED"].includes(session.state)) {
            console.log("client.useHere()");
            session.client.then(client => {
                client.useHere();
            });
        } else {
            console.log("session.state: " + session.state);
        }
        return session;
    } //start

    static async getStatus(sessionName, options = []) {
        Sessions.options = Sessions.options || options;
        Sessions.sessions = Sessions.sessions || [];

        var session = Sessions.getSession(sessionName);
        return session;
    } //getStatus

    static async addSesssion(sessionName) {
        var newSession = {
            name: sessionName,
            hook: null,
            qrcode: false,
            client: false,
            status: 'notLogged',
            state: 'STARTING'
        }
        Sessions.sessions.push(newSession);
        console.log("newSession.state: " + newSession.state);

        //setup session
        newSession.client = Sessions.initSession(sessionName);
        Sessions.setup(sessionName);

        return newSession;
    } //addSession

    static async initSession(sessionName) {
        var session = Sessions.getSession(sessionName);
        session.browserSessionToken = null;
        if (Sessions.options.jsonbinio_secret_key !== undefined) {//se informou secret key pra salvar na nuvem
            //busca token da session na nuvem
            var config = {
                method: 'get',
                url: 'https://api.jsonbin.io/b/' + Sessions.options.jsonbinio_bin_id,
                headers: {
                    'secret-key': Sessions.options.jsonbinio_secret_key
                }
            };
            const response = await axios(config);
            if (response.data.WAToken1 !== undefined) {
                session.browserSessionToken = response.data;
                console.log("puxou isso: " + JSON.stringify(session.browserSessionToken));
            } else {
                console.log("nao tinha token na nuvem");
            }
        }//if jsonbinio_secret_key
        if (process.env.ENGINE === 'VENOM') {
            const client = await venom.create(
                sessionName,
                (base64Qr, asciiQR, attempts) => {
                    session.state = "QRCODE";
                    session.qrcode = base64Qr;
                },
                // statusFind
                (statusSession, session) => {
                    console.log('#### status=' + statusSession + ' sessionName=' + session);
                }, {
                folderNameToken: 'tokens',
                headless: true,
                devtools: false,
                useChrome: true,
                debug: false,
                logQR: true,
                browserArgs: [
                    '--log-level=3',
                    '--no-default-browser-check',
                    '--disable-site-isolation-trials',
                    '--no-experiments',
                    '--ignore-gpu-blacklist',
                    '--ignore-certificate-errors',
                    '--ignore-certificate-errors-spki-list',
                    '--disable-gpu',
                    '--disable-extensions',
                    '--disable-default-apps',
                    '--enable-features=NetworkService',
                    '--disable-setuid-sandbox',
                    '--no-sandbox',
                    // Extras
                    '--disable-webgl',
                    '--disable-threaded-animation',
                    '--disable-threaded-scrolling',
                    '--disable-in-process-stack-traces',
                    '--disable-histogram-customizer',
                    '--disable-gl-extensions',
                    '--disable-composited-antialiasing',
                    '--disable-canvas-aa',
                    '--disable-3d-apis',
                    '--disable-accelerated-2d-canvas',
                    '--disable-accelerated-jpeg-decoding',
                    '--disable-accelerated-mjpeg-decode',
                    '--disable-app-list-dismiss-on-blur',
                    '--disable-accelerated-video-decode',
                ],
                refreshQR: 15000,
                autoClose: 60000,
                disableSpins: true,
                disableWelcome: false,
                createPathFileToken: true,
                waitForLogin: true
            },
                session.browserSessionToken
            );
            var browserSessionToken = await client.getSessionTokenBrowser();
            console.log("usou isso no create: " + JSON.stringify(browserSessionToken));
            session.state = "CONNECTED";
            return client;
        } //initSession
        if (process.env.ENGINE === 'WPPCONNECT') {
            const client = await wppconnect.create({
                session: session.name,
                catchQR: (base64Qrimg, asciiQR, attempts, urlCode) => {
                    session.state = "QRCODE";
                    session.qrcode = base64Qrimg;
                    session.CodeasciiQR = asciiQR;
                    session.CodeurlCode = urlCode;
                },
                statusFind: (statusSession, session) => {
                    console.log('- Status da sessão:', statusSession);
                    console.log('- Session name: ', session);
                },
                folderNameToken: 'tokens',
                headless: true,
                devtools: false,
                useChrome: true,
                debug: false,
                logQR: true,
                browserArgs: [
                    '--log-level=3',
                    '--no-default-browser-check',
                    '--disable-site-isolation-trials',
                    '--no-experiments',
                    '--ignore-gpu-blacklist',
                    '--ignore-certificate-errors',
                    '--ignore-certificate-errors-spki-list',
                    '--disable-gpu',
                    '--disable-extensions',
                    '--disable-default-apps',
                    '--enable-features=NetworkService',
                    '--disable-setuid-sandbox',
                    '--no-sandbox',
                    // Extras
                    '--disable-webgl',
                    '--disable-threaded-animation',
                    '--disable-threaded-scrolling',
                    '--disable-in-process-stack-traces',
                    '--disable-histogram-customizer',
                    '--disable-gl-extensions',
                    '--disable-composited-antialiasing',
                    '--disable-canvas-aa',
                    '--disable-3d-apis',
                    '--disable-accelerated-2d-canvas',
                    '--disable-accelerated-jpeg-decoding',
                    '--disable-accelerated-mjpeg-decode',
                    '--disable-app-list-dismiss-on-blur',
                    '--disable-accelerated-video-decode',
                ],
                disableSpins: true,
                disableWelcome: false,
                updatesLog: true,
                autoClose: 60000,
                createPathFileToken: true,
                waitForLogin: true,

            });
            wppconnect.defaultLogger.level = 'silly'
            session.state = "CONNECTED";
            return client;
        }
    }
    static async setup(sessionName) {
        var session = Sessions.getSession(sessionName);

        await session.client.then(client => {
            client.onStateChange(state => {
                session.state = state;
                if (state == "CONNECTED") {
                    if (Sessions.options.jsonbinio_secret_key !== undefined && session.browserSessionToken == undefined) {//se informou secret key pra salvar na nuvem
                        setTimeout(async () => {
                            console.log("gravando token na nuvem...");
                            //salva dados do token da sessão na nuvem
                            const browserSessionToken = await client.getSessionTokenBrowser();
                            var data = JSON.stringify(browserSessionToken);
                            var config = {
                                method: 'put',
                                url: 'https://api.jsonbin.io/b/' + Sessions.options.jsonbinio_bin_id,
                                headers: {
                                    'Content-Type': 'application/json',
                                    'secret-key': Sessions.options.jsonbinio_secret_key,
                                    'versioning': 'false'
                                },
                                data: data
                            };
                            await axios(config)
                                .then(function (response) {
                                    console.log(JSON.stringify(response.data));
                                })
                                .catch(function (error) {
                                    console.log(error);
                                });
                        }, 2000);
				
                    }//if jsonbinio_secret_key
                }//if CONNECTED
                console.log("session.state: " + state);
			
 		
				
            }); //.then((client) => Sessions.startProcess(client));
            //client.onMessage(async (message) => {
             //   var session = Sessions.getSession(sessionName);
              ///  if (session.hook != null) {
               //     var config = {
              //          method: 'post',
               //         url: session.hook,
                //        headers: {
                //            'Content-Type': 'application/json'
                //        },
                //        data: message
                //    };
                //    await axios(config)
                //        .then(function (response) {
                //            console.log(JSON.stringify(response.data));
                 ///       })
                 //       .catch(function (error) {
                 //           console.log(error);
                 //       });
              //  } else if (message.body == "TESTEBOT") {
             //       client.sendText(message.from, 'Hello\nfriend!');
            //    }
          //  });
		  
		
	//INICIA O ONMESSAGE	
	client.onMessage(async (message) => {
                var session = Sessions.getSession(sessionName);
                if (session.hook != null) {
                    var config = {
                        method: 'post',
                        url: session.hook,
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        data: message
                    };
                    await axios(config)
                        .then(function (response) {
                            console.log(JSON.stringify(response.data));
                        })
                        .catch(function (error) {
                            console.log(error);
                        });
                } else if (message.body == "TESTEBOT") {
                    client.sendText(message.from, 'Hello\nfriend!');
                }
				
		//OUTRAS COISAS AQUI
		//LOG DESATIVADO PRA EVITAR CRASH
		console.log(message.type) //chat | video | image | ptt
		console.log(message.body)
		console.log(message.from)
		console.log(message.to)
		console.log(message.chat.contact.pushname)
		console.log(message.isGroupMsg)
		
		//OBTEM HORA E DATA NA HORA DA MENSAGEM
		var now = new Date();
		var hour = now.getHours();
		var minutes = now.getMinutes();
		var seconds = now.getSeconds();
		var dd = String(now.getDate()).padStart(2, '0');
		var mm = String(now.getMonth() + 1).padStart(2, '0'); //January is 0!
		var yyyy = now.getFullYear();
		
		//##################################################################
		//PARTE DE TESTE DO OUTRO BOT
		
		const { type, id, from, t, sender, isGroupMsg, chat, chatId, caption, isMedia, mimetype, quotedMsg, mentionedJidList, author, quotedMsgObj } = message
        let { body } = message
        const { name } = chat
        let { pushname, verifiedName } = sender
        const prefix = '/'
        body = (type === 'chat' && body.startsWith(prefix)) ? body : ((type === 'image' && caption || type === 'video' && caption) && caption.startsWith(prefix)) ? caption : ''
        const command = body.slice(prefix.length).trim().split(/ +/).shift().toLowerCase()
        const args = body.slice(prefix.length).trim().split(/ +/).slice(1)
        const isCmd = body.startsWith(prefix)
		 
		/*if (isCmd && msgFilter.isFiltered(from) && !isGroupMsg) return console.log(color('[SPAM!]', 'red'), color(time, 'yellow'), color(`${command} [${args.length}]`), 'from', color(pushname))
        if (isCmd && msgFilter.isFiltered(from) && isGroupMsg) return console.log(color('[SPAM!]', 'red'), color(time, 'yellow'), color(`${command} [${args.length}]`), 'from', color(pushname), 'in', color(name))
        if (!isCmd && !isGroupMsg) return console.log('[RECV]', color(time, 'yellow'), 'Message from', color(pushname))
        if (!isCmd && isGroupMsg) return console.log('[RECV]', color(time, 'yellow'), 'Message from', color(pushname), 'in', color(name))
        if (isCmd && !isGroupMsg) console.log(color('[EXEC]'), color(time, 'yellow'), color(`${command} [${args.length}]`), 'from', color(pushname))
        if (isCmd && isGroupMsg) console.log(color('[EXEC]'), color(time, 'yellow'), color(`${command} [${args.length}]`), 'from', color(pushname), 'in', color(name))
        const botNumber = await client.getHostNumber()
        const groupId = isGroupMsg ? chat.groupMetadata.id : ''
        const groupAdmins = isGroupMsg ? await client.getGroupAdmins(groupId) : ''
        const isGroupAdmins = isGroupMsg ? groupAdmins.includes(sender.id) : false
        const isBotGroupAdmins = isGroupMsg ? groupAdmins.includes(botNumber + '@c.us') : false
        const isBanned = ban.includes(chatId)
        const owner = 'Your-phone-number' // eg 9190xxxxxxxx
        const isowner = owner+'@c.us' == sender.id */
		
		//DECLARA MENSAGENS AQUI
		var msg_recebida = message.body;
		const uaOverride = 'WhatsApp/2.2029.4 Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36'
        const isUrl = new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi)
		var comandos  = "Bem vindo ao OneBot!😁 - Comandos disponíveis:\n\n_/wiki_ - Faz uma pesquisa na Wikipédia.\n\n_/getmp3_ - Baixa uma música do YouTube.\n\n_/getmp4_ - Baixa um vídeo do YouTube.\n\n_/sticker_ - Envie a foto que deseja fazer a figurinha com o comando */sticker*.\n\n_/vsticker:_ - Envie o vídeo ou gif que deseja fazer a figurinha com o comando */vsticker*.\n\n_/brainly:_ - Faz uma pesquisa no Brainly\n\n_/rastreio:_ Rastreia um pacote nos correios.\n\n_Mais comandos disponíveis em breve!_";
		var bot_start = "Bem vindo ao OneBot!😁 - Veja alguns comandos disponíveis usando */comandos*\n\nInfo.: Hora: "+hour+":"+minutes+":"+seconds+"\nData: "+ dd + '/' + mm + '/' + yyyy +"";
		var msg_final_chat = "Mensagem recebida: \n\n"+ "```"+msg_recebida+"```" + "\n\nHora: "+hour+":"+minutes+":"+seconds+"\nData: "+ dd + '/' + mm + '/' + yyyy +"";
		var msg_final_sticker = "Mensagem recebida: \n\n"+ "Sticker!"+ "\n\nHora: "+hour+":"+minutes+":"+seconds+"\nData: "+ dd + '/' + mm + '/' + yyyy +"";
		var msg_final_image = "Processando imagem... \n\n_Aguarde,estamos criando sua figurinha_";
		var msg_receber_video  = "Vídeo/Gif recebido!...\n\n_Aguarde,estamos criando sua figurinha animada_";
		var msg_processando_video  = "Processando vídeo...\n\n_Este processo pode demorar um pouco!_\n\n_Se você não receber seu sticker,tente enviar a mídia em outro formato!_";
		var msg_statusbot = "OneBot está ativo!"+"\n\nHora: "+hour+":"+minutes+":"+seconds+"\nData: "+ dd + '/' + mm + '/' + yyyy +"";
		var sobre_onebot = "Obrigado por usar o OneBot <3\n\nDúvidas ou sugestões,converse com o desenvolvedor:\n\nhttps://api.whatsapp.com/send/?phone=5533999999999&text&app_absent=0";
		
		switch (command) {
			case 'start':	
			client.reply(message.from, bot_start , message.id.toString()).then()
			break

			case 'iniciar':	
			client.reply(message.from, bot_start , message.id.toString()).then()
			break
			
			case 'ajuda':			
			client.reply(message.from, comandos , message.id.toString()).then()			
			break

			case 'comandos':			
			client.reply(message.from, comandos , message.id.toString()).then()			
			break
			
			case 'status':			
			client.reply(message.from, msg_statusbot , message.id.toString()).then()		
			break

			case 'wiki':			
			 var msg_text_to_search = msg_recebida.substring(6);
				try {
 				    const text_to_search = encodeURI(msg_text_to_search);
	                displaySearchResults(text_to_search);
				} catch (e) { 
 				   console.error(e);
				}	
			break
			
			case 'getmp4':
				try {
					  var url = msg_recebida.substring(8);
					  var regExp = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
					  //VALIDAR URL:
                        if (url.match(regExp)) {
                           YtMp4(url);
						   console.log("URL IS VALID");
                       }else{
						   client.reply(message.from, '*Link inválido!*\n\nPor favor envie um link do YouTube válido.' , message.id.toString()).then()
					       console.log("URL NOT VALID");
				 }
					  		    					
			     } catch (e){
					 
				}
			
			break
			
			case 'getmp3':
				 try {				     
					var url = msg_recebida.substring(8);
					if (url.includes('youtu.be')){
                         //PEGA APENAS O ID						
 				         var url_be = url.substring(17);	
						 //ENVIA PRA DOWNLOAD
						 try {
							  YtMp3(url_be);	
						 } catch (err) {
							 client.reply(message.from, 'Não foi possível carregar o conteúdo solicitado!\nTente novamente mais tarde' , message.id.toString()).then()
						  }
                        					 						 
			        }else{
                          //ENVIA URL PRA OBTER ID						
			              var url_final = YouTubeGetID(url);                    
						  try {
						 //PEGA ID E ENVIA PRA DONWLOAD	
						   YtMp3(url_final);		
						  } catch (err) {
							 client.reply(message.from, 'Não foi possível carregar o conteúdo solicitado!\nTente novamente mais tarde' , message.id.toString()).then()
						  }						  
			         }			
				 } catch (err) {					 
					client.reply(message.from, 'Não foi possível carregar o conteúdo solicitado!\nTente novamente mais tarde' , message.id.toString()).then()
				 }	
			break
			
			case 'sticker':
            if (isMedia && type == 'image') {
               	client.reply(message.from, msg_final_image , message.id.toString()).then()
			
					try {
						 var file_title = message.from;           
						 const filename = `${message.t}.${mime.extension(message.mimetype)}`;
						 const final_path = './media_cache/'+filename;
						 //const filename = 'teste.jpg';
						 const mediaData = await decryptMedia(message);
						 const imageBase64 = `data:${message.mimetype};base64,${mediaData.toString(
						 'base64'
						 )}`;
						 fs.writeFile(final_path, mediaData, function(err) {
						 if (err) {
						 return console.log(err);
						  }
						 //ARQUIVO SALVO SUCESSO
						 console.log("Nome da imagem: " + filename);
						 console.log("Caminho da imagem: " + final_path);
						 console.log('O arquivo foi salvo!');

						 //ENVIANDO FIGURINHA:
						 client.sendImageAsSticker(message.from, final_path)
						 .then((result) => {
						 console.log('Result: ', result); //return object success
						 client.reply(message.from, sobre_onebot , message.id.toString()).then()
				 
						 //APAGA ARQUIVO DO SERVIDOR
						 var millisecondsToWait = 10000;
						 setTimeout(function() {
						 fs.unlink(final_path, (err) => {
						 	if (err) {
						 	   console.log("failed to delete local sticker-img file:"+err);
						 	} else {
          					   console.log('successfully deleted sticker-img file');                                
                            } 
						});	               
						}, millisecondsToWait);
				        })
				        .catch((erro) => {
				        console.error('Error when sending: ', erro); //return object error
				        client.reply(message.from, 'Não foi possível processar o conteúdo solicitado!\nTente novamente mais tarde' , message.id.toString()).then()
 			            });
                      });
				
			    } catch (e){
			           client.reply(message.from, 'Não foi possível processar o conteúdo solicitado!\nTente novamente mais tarde' , message.id.toString()).then()
			    }
            }
						
            break
			
			
		    case 'vsticker':
            if (isMedia && type == 'video') {
             if (mimetype === 'video/mp4' && message.duration < 30) {
					client.reply(message.from, msg_receber_video , message.id.toString()).then()
			 try{
			
			var file_title = message.from;           
			const filename = `${message.t}.${mime.extension(message.mimetype)}`;
			const final_path = './media_cache/'+filename;
			const final_video_resize = './media_cache/'+ file_title + '-resize.mp4';
			var final_gif_path = './media_cache/'+file_title+'.gif';
			//const filename = 'teste.jpg';
			const mediaData = await decryptMedia(message);
			const imageBase64 = `data:${message.mimetype};base64,${mediaData.toString(
 			'base64'
    		 )}`;
            fs.writeFile(final_path, mediaData, function(err) {
                if (err) {
                 return console.log(err);
               }
             //ARQUIVO SALVO SUCESSO
			console.log("Nome do video: " + filename);
            console.log("Caminho do video: " + final_path);
			console.log('O arquivo foi salvo!');

            //CONVERTE VIDEO PARA 512X512
			var filename = final_path;
			console.log('Input File ... ' + filename);
		
			ffmpegf(filename)
            // Generate 720P video
            .output('./media_cache/'+ file_title + '-resize.mp4')
            .videoCodec('libx264')  
            .noAudio()
            .size('512x512')
            .on('error', function(err) {
                console.log('An error occurred: ' + err.message);
				client.reply(message.from, 'Não foi possível processar sua figurinha\n\nTente novamente depois' , message.id.toString()).then()
                
            })	
            .on('progress', function(progress) { 
                console.log('... frames: ' + progress.frames);
                
            })
            .on('end', function() { 
                console.log('Finished processing'); 
				client.reply(message.from, msg_processando_video , message.id.toString()).then()
							//CONVERTER PARA GIF
			gify(final_video_resize, final_gif_path, function(err){
  			    if (err){
					throw err;
					client.reply(message.from, 'Não foi possível processar sua figurinha\n\nTente novamente depois' , message.id.toString()).then()
				}else{
															
				//comeco figurinha	
			     //ENVIANDO FIGURINHA:
			     client.sendImageAsStickerGif(message.from, final_gif_path)
			     .then((result) => {
				 console.log('Result: ', result); //return object success
				 client.reply(message.from, sobre_onebot , message.id.toString()).then()
				 
				//APAGA ARQUIVO DO SERVIDOR
				var millisecondsToWait = 10000;
                setTimeout(function() {
				//REMOVE MP4	
 				fs.unlink(final_path, (err) => {
      					if (err) {
         					console.log("failed to delete local sticker-mp4 file:"+err);
      					} else {
          					console.log('successfully deleted sticker-mp4 file');                                
                        } 
                })	
				//REMOVE MP4 RESIZE	
 				fs.unlink(final_video_resize, (err) => {
      					if (err) {
         					console.log("failed to delete local sticker-mp4 file:"+err);
      					} else {
          					console.log('successfully deleted sticker-mp4 file');                                
                        } 
                })					
				//REMOVE GIF	
 				fs.unlink(final_gif_path, (err) => {
      					if (err) {
         					console.log("failed to delete local sticker-mp4 file:"+err);
      					} else {
          					console.log('successfully deleted sticker-mp4 file');                                
                        } 
                });				
                }, millisecondsToWait);
				 })
			    .catch((erro) => {
   				    console.error('Error when sending: ', erro); //return object error
				   client.reply(message.from, 'Não foi possível processar sua figurinha\n\nPor favor verifique o tamanho e resolução da mídia enviada' , message.id.toString()).then()
 			   });
            //FINAL FIGURINHA	
				}
			}); //FINAL GIFY
                
            })
           .run();
			
			});		 
			} catch (e) {
				client.reply(message.from, 'Não foi possível processar sua figurinha\n\nTente novamente depois' , message.id.toString()).then()
			}	   

			}
			
			}
            break 
			
			case 'tempo':	
			var cidade = msg_recebida.substring(7);
			var cidade_formatada = format_latin(cidade);
			weather.loction(cidade_formatada).then(weather => sendclima(weather));
		  
			break
			
			case 'rastreio':	
			var codigo = msg_recebida.substring(10);

			try {
				correios.sro.rastrearObjeto(codigo).then(function(res){
                    console.log(res)
                    var obj = res.status_list;
					var objString = JSON.stringify(obj);
				    var rastreio_completo = objString.replace(/Status:/g, '*Situação:*').replace(/Data  :/g, '*Data:*').replace(/Origem:/g, '*Saindo de:*').replace(/Destino:/g, '*Encaminhado para:*').replace(/"status":/g, '').replace(/"data":/g, '').replace(/"origem":/g, '').replace(/"destino":/g, '').replace(/\},{/g, '\n\n').replace(/,/g, '\n').replace(/\}/g, '').replace(/\{/g, '').replace(/\[/g, '').replace(/\]/g, '').replace(/\"/g, '');
					var total_arrays = Object.keys(obj).length;
                    var last_update = total_arrays	-1;
                    var get_last_update_status	= obj[last_update].status	
			        var get_last_update_data	= obj[last_update].data	
                    var get_last_update_origem	= obj[last_update].origem
                    var get_last_update_destino	= obj[last_update].destino	
					//MANDA MSG COM ULTIMO UPDATE DO PACOTE
					//client.reply(message.from, '⚠️ *BUSCA RÁPIDA DE PACOTE!*\n\n' + '_ATENÇÃO: Esta função serve apenas para uma consulta simples sobre seu pacote.Não guardamos informações nem notificamos caso o status da sua encomenda atualize!_\n\n' +  '*ÚLTIMA ATUALIZAÇÃO DO SEU PACOTE:* \n\n' + get_last_update_status + "\n" + get_last_update_data + "\n" + get_last_update_origem + "\n" + get_last_update_destino, message.id.toString()).then()					
	               	//MANDA MSG COM RASTREIO COMPLETO
					//client.reply(message.from, '⚠️ *HISTÓRICO COMPLETO DO SEU PACOTE!*\n\n' + rastreio_completo, message.id.toString()).then()					
                    //MANDA UMA MSG COM TODAS AS INFO
					client.reply(message.from, '⚠️ *STATUS DO PACOTE*' + "\n\nID: "+ codigo +'\n\n' + '_ATENÇÃO: Isto é apenas uma consulta ao seu pacote,não iremos salvá-lo nem notificar se atualizar o rastreio_\n\n' +  rastreio_completo, message.id.toString()).then()
                })	
			}catch (e){
               client.reply(message.from, 'Não foi possível encontrar o seu pacote\n\nTente novamente depois' , message.id.toString()).then()
			}				
			
			break

			
			case 'brainly':			
			const brainly = new Client();
			var pergunta = msg_recebida.substring(9);
			console.log("Pergunta: " + pergunta);
          
			try {
			brainly.search(pergunta)
 			 .then(questions => {
  			  const question = questions[0]
  			  const answer = question.answers[0]
			  
			  let itemTitle = question.content;
 			  let itemResposta1 = answer.content;
			  let itemAutorNome = answer.author.nick;
			  let itemRatingQuestao = answer.rating;
			  var itemthanksCount = answer.thanksCount;
			  //var resposta_formatada = itemResposta1.replace(/<[^>]*>?/gm, '');
			  const html = itemResposta1;
			  const resposta_formatada = htmlToText(html, {
			    wordwrap: 130
			  });
			  var final_resultado = "⚠️ *RESULTADO DA PESQUISA!*\n\n" + "_Se não achou a pergunta/resposta desejada,tente fazer a pergunta com mais detalhes_" + "\n\n*Pergunta encontrada:* " + itemTitle +"\n\n*Resposta encontrada:* " + resposta_formatada  + "\n\n*Autor da resposta:* " + itemAutorNome + "\n\n*Avaliação da resposta:* " + itemRatingQuestao + " estrelas" + "\n\n*Curtidas:* " + itemthanksCount + "\n\n************\n" + sobre_onebot;
			  client.reply(message.from, final_resultado , message.id.toString()).then()
			 

  			  console.log(question)
  			  console.log(answer)
  			})
    
		
			}catch (e){
				client.reply(message.from, 'Não foi possível executar a pesquisa no Brainly :(\n\nTente novamente' , message.id.toString()).then()
			}
	     	
			
	
			break 
			
	
		}
		
		//####################################################################
		
		

	
	    //STATUS DO BOT AO INICIAR
		//client.sendText('seu_numero', '✅ OneBot reiniciado com sucesso! ✅')
	
		//GERAR CARACTERES DO NADA(DESATIVADO)
		/*function makeid() {
             var text = "";
             var possible = "12345";

             for (var i = 0; i < 1; i++)
             text += possible.charAt(Math.floor(Math.random() * possible.length))
          return text;
        }
		
		//GERA ID RANDOM
		var gerar_random = makeid();*/
		
		function sendclima(weather){
				var cidadew = "*Cidade:* " + weather.location.name;
				var regiao = "\n*Região:* " + weather.location.region;
				var pais = "\n*País:* " + weather.location.country;
			    var update = "\n\n*Última atualização:* " + weather.current.last_updated;
				var temperaturac = "\n*Temperatura:* " + weather.current.temp_c;
				var umidade = "\n*Umidade:* " + weather.current.humidity;
				var nuvens = "\n*Nuvens:* " + weather.current.cloud;
				var uv = "\n*Índice UV:* " + weather.current.uv;
				var vento = "\n*Vento:* " + weather.current.wind_kph;
				//var condicao = "\n\n*Condição:* " + weather.current.codition.text
								
				client.reply(message.from, '⚠️ *TEMPO ATUAL* \n\n' + cidadew + regiao + pais + temperaturac + umidade + nuvens + uv + vento + update, message.id.toString()).then()

		}
		
		function format_latin(cidade){ 	
 				 var r = cidade.toLowerCase();
                        r = r.replace(new RegExp("\\s", 'g'),"");
                        r = r.replace(new RegExp("[àáâãäå]", 'g'),"a");
                        r = r.replace(new RegExp("æ", 'g'),"ae");
                        r = r.replace(new RegExp("ç", 'g'),"c");
                        r = r.replace(new RegExp("[èéêë]", 'g'),"e");
                        r = r.replace(new RegExp("[ìíîï]", 'g'),"i");
                        r = r.replace(new RegExp("ñ", 'g'),"n");                            
                        r = r.replace(new RegExp("[òóôõö]", 'g'),"o");
                        r = r.replace(new RegExp("œ", 'g'),"oe");
                        r = r.replace(new RegExp("[ùúûü]", 'g'),"u");
                        r = r.replace(new RegExp("[ýÿ]", 'g'),"y");
                        r = r.replace(new RegExp("\\W", 'g'),"");
                        return r;
         }//FINAL
		
		
		function displaySearchResults(text_to_search){ 	
 				 let url = `https://pt.wikipedia.org/api/rest_v1/page/summary/${text_to_search}`;				 
                 console.log(url);				 
				 fetch(url)
				 .then(function(response) {
				     return(response.json());
				 })
				 .then(function(data){
					 finalresult(data);
				
				 })
				.catch(function () {
				     console.log('Ocorreu um erro');
					 client.reply(message.from, 'Não foi possível carregar o conteúdo solicitado.\nPor favor,tente novamente' , message.id.toString()).then()
				 });	
			
         }//FINAL
		
		 
         function finalresult(myArray){
			console.log(myArray);
				let itemTitle = myArray.title;
 			 	let itemUrl = myArray.content_urls.desktop.page;
 			 	let itemText = myArray.extract;
				var final_rsp = "*Pesquisa na Wikipédia*"+"\n\nTítulo: "+"*"+itemTitle+"*" + "\n\nResultado:\n\n"+ itemText+"\n\nFonte: "+itemUrl+ "\n\n"+"_"+"Acesso em: "+ dd + '/' + mm + '/' + yyyy + " às " + hour+":"+minutes+":"+seconds+"_";
			    client.reply(message.from, final_rsp , message.id.toString()).then()	
         }//FINAL
		 

		function YouTubeGetID(url){
			try{
			   var ID = '';
		       url = url.replace(/(>|<)/gi,'').split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
			   if(url[2] !== undefined) {
			    ID = url[2].split(/[^0-9a-z_\-]/i);
			    ID = ID[0];
			}
			else {
			     ID = url;
 			}
   			     return ID;
			} catch (err) {	
				client.reply(message.from, 'Não foi possível carregar o conteúdo solicitado!\nTente novamente mais tarde' , message.id.toString()).then()
				}
         }//FINAL
		

        function YtMp4(url){
			client.reply(message.from, 'Iniciando download da mídia...\n\n_Isso pode demorar um pouco dependendo do tamanho do arquivo_' , message.id.toString()).then()
			try{
			var file_title = message.from; 
			var fsmp4 = fs.createWriteStream('./media_cache/'+file_title+'.mp4');
			ytdl(url, { filter: format => format.container === 'mp4' })
              .pipe(fsmp4);
			 fsmp4.on('finish', function(){
                    console.log('file downloaded!');
			        /*var linkvideo = "http://onebot.onehostbr.xyz/onebot/cache/"+file_title+".mp4";
			        client.reply(message.from,  'Download pronto!Baixe o seu vídeo pelo link: \n\n'+ linkvideo+ '\n\n_O arquivo será apagado do servidor em 1 minuto!_', message.id.toString()).then()*/
                    //TENTANTO ENVIAR VIA ARQUIVO
					client.sendFile(
					    message.from,
					    './media_cache/'+file_title+'.mp4',
					    'video.mp4',
 					    sobre_onebot
					 )
					  .then((result) => {
 					   console.log('Result: ', result); //return object success
					  })
  					.catch((erro) => {
 					   console.error('Error when sending: ', erro); //return object error
 					 });
					

			   //APAGA ARQUIVO DEPOIS DE 1 MIN e MEIO
				var millisecondsToWait = 60000;
                setTimeout(function() {
 				fs.unlink("./media_cache/"+file_title+".mp4", (err) => {
      					if (err) {
         					console.log("failed to delete local video file:"+err);
      					} else {
          					console.log('successfully deleted video file');                                
                        } 
                });	               
                 }, millisecondsToWait);

			  });
			  fsmp4.on('error', function(){
				  console.error;
				  client.reply(message.from, 'Não foi possível carregar o conteúdo solicitado!\nTente novamente mais tarde' , message.id.toString()).then()
			  });				  
				} catch (err) {	
					client.reply(message.from, 'Não foi possível carregar o conteúdo solicitado!\nTente novamente mais tarde' , message.id.toString()).then()
				}
			
         }//FINAL			
		function YtMp3(url){
		   console.log("Video ID: "+ url);
		   client.reply(message.from, 'Iniciando download da mídia...\n\n_Isso pode demorar um pouco dependendo do tamanho do arquivo_' , message.id.toString()).then()
           var file_title = message.from; 
		   var YD = new YoutubeMp3Downloader({
					 "ffmpegPath": "ffmpeg",        // FFmpeg binary location
					 "outputPath": "./media_cache/",    // Output file location (default: the home directory)
					 "youtubeVideoQuality": "highestaudio",  // Desired video quality (default: highestaudio)
					 "queueParallelism": 2,                  // Download parallelism (default: 1)
					 "progressTimeout": 2000,                // Interval in ms for the progress reports (default: 1000)
					 "allowWebm": false                      // Enable download from WebM sources (default: false)
					 });
					 //Download video and save as MP3 file
						 try{
						  YD.download(url, file_title+".mp3");
						  YD.on("error", function(error) {
						  client.reply(message.from, 'Não foi possível carregar o conteúdo solicitado!\nVerifique sua URL e tente novamente' , message.id.toString()).then()
					      console.log(error);
					      });
						  
						  //AO FINALIZAR
					 
						 YD.on("finished", function(err, data) {
							 client.sendFile(
							 message.from,
							 './media_cache/'+file_title+'.mp3',
							 'audio.mp3',
							 'Downloaded with OneBot <3'
  							 )
							 .then((result) => {
							 console.log('Result: ', result); //return object success
							    client.reply(message.from, sobre_onebot , message.id.toString()).then()
                                //APAGA ARQUIVO DO SERVIDOR
							 	var millisecondsToWait = 60000;
  							    setTimeout(function() {
 								fs.unlink("./media_cache/"+file_title+".mp3", (err) => {
      								if (err) {
         								console.log("failed to delete local video file:"+err);
      								} else {
          								console.log('successfully deleted video file');                                
                      				 } 
							 });	               
							 }, millisecondsToWait);							 
							   })
  							 .catch((erro) => {
  							   console.error('Error when sending: ', erro); //return object error
							   client.reply(message.from, 'Não foi possível carregar o conteúdo solicitado!\nVerifique sua URL e tente novamente' , message.id.toString()).then()
  							 });
					     console.log(JSON.stringify(data));
					      });
 
 
					     YD.on("progress", function(progress) {
 					     console.log(JSON.stringify(progress));
					     });
			        }catch (e) { 
 		         	     client.reply(message.from, 'Não foi possível carregar o conteúdo solicitado!\nVerifique sua URL e tente novamente' , message.id.toString()).then()
		             }					
			   		
		  
		}//FINAL
		 

		
		//VERIFICA ID DO GRUPO E RESPONDE
		//###############################################################################
		//INSERIR ID DO GRUPO
		//INICIO COMMENT ID GRUPO
		//if (message.from.includes('grupo_id')) {// VERIFICA O ID GRUPO QUE FOI ENVIADO
			//};
		
		


            });//FINAL
        });//FINAL
    } //FINAL SETUP
 //###############################################################################
 
   
				 
    static async closeSession(sessionName) {
        var session = Sessions.getSession(sessionName);
        if (session) { //só adiciona se não existir
            if (session.state != "CLOSED") {
                if (session.client)
                    await session.client.then(async client => {
                        try {
                            await client.close();
                        } catch (error) {
                            console.log("client.close(): " + error.message);
                        }
                        session.state = "CLOSED";
                        session.client = false;
                        console.log("client.close - session.state: " + session.state);
                    });
                return { result: "success", message: "CLOSED" };
            } else { //close
                return { result: "success", message: session.state };
            }
        } else {
            return { result: "error", message: "NOTFOUND" };
        }
    } //close

    static getSession(sessionName) {
        var foundSession = false;
        if (Sessions.sessions)
            Sessions.sessions.forEach(session => {
                if (sessionName == session.name) {
                    foundSession = session;
                }
            });
        return foundSession;
    } //getSession

    static getSessions() {
        if (Sessions.sessions) {
            return Sessions.sessions;
        } else {
            return [];
        }
    } //getSessions

    static async getQrcode(sessionName) {
        var session = Sessions.getSession(sessionName);
        if (session) {
            //if (["UNPAIRED", "UNPAIRED_IDLE"].includes(session.state)) {
            if (["UNPAIRED_IDLE"].includes(session.state)) {
                //restart session
                await Sessions.closeSession(sessionName);
                Sessions.start(sessionName);
                return { result: "error", message: session.state };
            } else if (["CLOSED"].includes(session.state)) {
                Sessions.start(sessionName);
                return { result: "error", message: session.state };
            } else { //CONNECTED
                if (session.status != 'isLogged') {
                    return { result: "success", message: session.state, qrcode: session.qrcode };
                } else {
                    return { result: "success", message: session.state };
                }
            }
        } else {
            return { result: "error", message: "NOTFOUND" };
        }
    } //getQrcode
	
	

 static async sendText(req) {
        var params = {
            sessionName: req.body.sessionName,
            number: req.body.number,
            text: req.body.text
        }
        var session = Sessions.getSession(params.sessionName);
        if (session) {
            if (session.state == "CONNECTED") {
                await session.client.then(async client => {
                    console.log('#### send msg =', params);
                    return await client.sendText(params.number + '@c.us', params.text);
                });
                return { result: "success" }
            } else {
                return { result: "error", message: session.state };
            }
        } else {
            return { result: "error", message: "NOTFOUND" };
        }
    } //message backup


    static async sendTextToStorie(req) {
        var params = {
            sessionName: req.body.sessionName,
            text: req.body.text
        }
        var session = Sessions.getSession(params.sessionName);
        if (session) {
            if (session.state == "CONNECTED") {
                await session.client.then(async client => {
                    console.log('#### send msg =', params);
                    return await client.sendText('status@broadcast', params.text);
                });
                return {
                    result: "success"
                }
            } else {
                return {
                    result: "error",
                    message: session.state
                };
            }
        } else {
            return {
                result: "error",
                message: "NOTFOUND"
            };
        }
    } //message to storie

    static async sendFile(sessionName, number, base64Data, fileName, caption) {
        var session = Sessions.getSession(sessionName);
        if (session) {
            if (session.state == "CONNECTED") {
                var resultSendFile = await session.client.then(async (client) => {
                    var folderName = fs.mkdtempSync(path.join(os.tmpdir(), session.name + '-'));
                    var filePath = path.join(folderName, fileName);
                    fs.writeFileSync(filePath, base64Data, 'base64');
                    console.log(filePath);
                    return await client.sendFile(number + '@c.us', filePath, fileName, caption);
                }); //client.then(
                return { result: "success" };
            } else {
                return { result: "error", message: session.state };
            }
        } else {
            return { result: "error", message: "NOTFOUND" };
        }
    } //message

    static async sendImageStorie(sessionName, base64Data, fileName, caption) {
        var session = Sessions.getSession(sessionName);
        if (session) {
            if (session.state == "CONNECTED") {
                var resultSendFile = await session.client.then(async (client) => {
                    var folderName = fs.mkdtempSync(path.join(os.tmpdir(), session.name + '-'));
                    var filePath = path.join(folderName, fileName);
                    fs.writeFileSync(filePath, base64Data, 'base64');
                    console.log(filePath);
                    return await client.sendFile('status@broadcast', filePath, fileName, caption);
                }); //client.then(
                return {
                    result: "success"
                };
            } else {
                return {
                    result: "error",
                    message: session.state
                };
            }
        } else {
            return {
                result: "error",
                message: "NOTFOUND"
            };
        }
    } //sendImageStorie

    static async saveHook(req) {
        var sessionName = req.body.sessionName;
        /**
         * Verifica se encontra sessão 
         */
        var foundSession = false;
        var foundSessionId = null;
        if (Sessions.sessions)
            Sessions.sessions.forEach((session, id) => {
                if (sessionName == session.name) {
                    foundSession = session;
                    foundSessionId = id;
                }
            });
        // Se não encontrar retorna erro
        if (!foundSession) {
            return { result: "error", message: 'Session not found' };
        } else {
            // Se encontrar cria variáveis
            var hook = req.body.hook;
            foundSession.hook = hook;
            Sessions.sessions[foundSessionId] = foundSession;
            return { result: "success", message: 'Hook Atualizado' };
        }
    }

    static async sendContactVcard(sessionName, number, numberCard, nameCard) {
        var session = Sessions.getSession(sessionName);
        if (session) {
            if (session.state == "CONNECTED") {
                var resultSendContactVcard = await session.client.then(async (client) => {
                    return await client.sendContactVcard(number + '@c.us', numberCard + '@c.us', nameCard);
                }); //client.then(
                return {
                    result: "success"
                };
            } else {
                return {
                    result: "error",
                    message: session.state
                };
            }
        } else {
            return {
                result: "error",
                message: "NOTFOUND"
            };
        }
    } //vcard

    static async sendVoice(sessionName, number, voice) {
        var session = Sessions.getSession(sessionName);
        if (session) {
            if (session.state == "CONNECTED") {
                var resultSendVoice = await session.client.then(async (client) => {
                    return await client.sendVoiceBase64(number + '@c.us', voice);
                }); //client.then(
                return {
                    result: "success"
                };
            } else {
                return {
                    result: "error",
                    message: session.state
                };
            }
        } else {
            return {
                result: "error",
                message: "NOTFOUND"
            };
        }
    } //voice

    static async sendLocation(sessionName, number, lat, long, local) {
        var session = Sessions.getSession(sessionName);
        if (session) {
            if (session.state == "CONNECTED") {
                var resultSendLocation = await session.client.then(async (client) => {
                    return await client.sendLocation(number + '@c.us', lat, long, local);
                }); //client.then(
                return {
                    result: "success"
                };
            } else {
                return {
                    result: "error",
                    message: session.state
                };
            }
        } else {
            return {
                result: "error",
                message: "NOTFOUND"
            };
        }
    } //location

    static async sendLinkPreview(sessionName, number, url, caption) {
        var session = Sessions.getSession(sessionName);
        if (session) {
            if (session.state == "CONNECTED") {
                var resultSendLinkPreview = await session.client.then(async (client) => {
                    return await client.sendLinkPreview(number + '@c.us', url, caption);
                }); //client.then(
                return {
                    result: "success"
                };
            } else {
                return {
                    result: "error",
                    message: session.state
                };
            }
        } else {
            return {
                result: "error",
                message: "NOTFOUND"
            };
        }
    } //link

    static async getAllChatsNewMsg(sessionName) {
        var session = Sessions.getSession(sessionName);
        if (session) {
            if (session.state == "CONNECTED") {
                var resultGetAllChatsNewMsg = await session.client.then(async (client) => {
                    return client.getAllChatsNewMsg();
                });
                return {
                    result: resultGetAllChatsNewMsg
                };
            } else {
                return {
                    result: "error",
                    message: session.state
                };
            }
        } else {
            return {
                result: "error",
                message: "NOTFOUND"
            };
        }
    } //getAllChatsNewMsg

    static async getAllUnreadMessages(sessionName) {
        var session = Sessions.getSession(sessionName);
        if (session) {
            if (session.state == "CONNECTED") {
                var resultGetAllUnreadMessages = await session.client.then(async (client) => {
                    return await client.getAllUnreadMessages();
                });
                return {
                    result: resultGetAllUnreadMessages
                };
            } else {
                return {
                    result: "error",
                    message: session.state
                };
            }
        } else {
            return {
                result: "error",
                message: "NOTFOUND"
            };
        }
    } //getAllUnreadMessages

    static async checkNumberStatus(sessionName, number) {
        var session = Sessions.getSession(sessionName);
        //console.log(sessionName+number);
        if (session) {
            if (session.state == "CONNECTED") {
                var resultcheckNumberStatus = await session.client.then(async (client) => {
                    return await client.checkNumberStatus(number + '@c.us');
                });
                return {
                    result: resultcheckNumberStatus
                };
            } else {
                return {
                    result: "error",
                    message: session.state
                };
            }
        } else {
            return {
                result: "error",
                message: "NOTFOUND"
            };
        }
    } //saber se o número é válido

    static async getNumberProfile(sessionName, number) {
        var session = Sessions.getSession(sessionName);
        //console.log(sessionName+number);
        if (session) {
            if (session.state == "CONNECTED") {
                var resultgetNumberProfile = await session.client.then(async (client) => {
                    return await client.getNumberProfile(number + '@c.us');
                });
                return {
                    result: resultgetNumberProfile
                };
            } else {
                return {
                    result: "error",
                    message: session.state
                };
            }
        } else {
            return {
                result: "error",
                message: "NOTFOUND"
            };
        }
    } //receber o perfil do usuário
}
