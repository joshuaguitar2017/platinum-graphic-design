class UeWhatsAppWidget {
    constructor(widget) {
        this.dom = widget;
        this.type = this.dom.dataset.widgetType;
        this.openByDefault = this.dom.dataset.defaultOpen;
        this.popup = this.dom.querySelector('.ue-whatsapp-chat-popup');
		this.placement = this.dom.dataset.placement;
		
		
		
        /* initialize */
        this.init();
        this.initEvents();
    }

    init = () => {

        // Check if cache is used
        if(this.openByDefault === 'true') {
            this.initCache();
        }

        let btnEl;
    
        /* Set chat message on link */ 
        switch (this.type) {
            case 'only_button':
                btnEl = this.dom.querySelector('.ue-whatsapp-chat-button');
                this.setChatMessage(btnEl, false)
                break;
            case 'send_button':
                btnEl = this.dom.querySelector('.ue-whatsapp-chat-popup-message-send-link');
                this.setChatMessage(btnEl, true)
                break;
            case 'agents':
                this.dom.querySelectorAll('.ue-whatsapp-chat-agent').forEach( (agent) => { 
                    this.setChatMessage(agent, true)
                });
                break;
            case 'agents_with_message':
            this.sendMsgContainer = document.querySelector('.ue-whatsapp-chat-popup-agents-message-container');
            this.sendMsgArea = this.sendMsgContainer.querySelector('.ue-whatsapp-chat-popup-agents-message-container-text');
            this.dom.querySelectorAll('.ue-whatsapp-chat-agent').forEach( (agent) => { 
                this.setChatMessage(agent, true)
            });
            this.sendMsgBtn = this.sendMsgContainer.querySelector('.ue-whatsapp-chat-popup-message-send-link');
            this.sendMsgBtn.addEventListener('click', () => {this.onAgentSendBtnClick()})
            break;
            default:
                break;
        }

		
        
    }

    initCache = () =>{

        this.storageKey = 'ue_whatsapp_show';
        this.cacheState = this.dom.dataset.cacheState;
        this.cacheExpiry = this.dom.dataset.cacheTtl;

        /* Delete existing cache if user chooses not to store cache */
        if(this.cacheState === 'false') {
            localStorage.removeItem(this.storageKey);
            this.popup.classList.toggle('uc-show');
            return;
        }

        let itemStr = localStorage.getItem(this.storageKey);
        const clock = new Date();
        this.storageItem = {
                show: "true",
                expiry: ( clock.getTime() + ( Number(this.cacheExpiry) * 60 * 60000 ) ),
        }
        
        if (!itemStr){
            localStorage.setItem(this.storageKey, JSON.stringify(this.storageItem));
            itemStr = localStorage.getItem(this.storageKey);
            this.item = JSON.parse(itemStr);
            this.popup.classList.toggle('uc-show');
            return;
        } 
        
        
        this.item = JSON.parse(itemStr);
        
        

        if (clock.getTime() > this.item.expiry) {
            localStorage.removeItem(this.storageKey)
            localStorage.setItem(this.storageKey, JSON.stringify(this.storageItem));
            itemStr = localStorage.getItem(this.storageKey);
            this.item = JSON.parse(itemStr);
            this.popup.classList.toggle('uc-show');
            return;
        }

        if (this.item.show === 'true') {
            this.popup.classList.toggle('uc-show');
            return;
        } 

    }

    setChatMessage = (btnEl, setClickEvent) => {

        if(setClickEvent) {
            if( this.type === 'agents_with_message') {
                btnEl.addEventListener('click', (event) => {
                    event.preventDefault();
                    this.updateChatMesagge(btnEl);
                })
                return;
            }else{
                btnEl.addEventListener('click', () => {this.updateChatMesagge(btnEl)})
                return;
            }
        }
        this.updateChatMesagge(btnEl);
    }

    updateChatMesagge = (btnEl) => {
        
        switch(this.type) {
            case 'agents_with_message':
                this.showMessageContainer(btnEl);
                break;
            case 'send_button':
                const sendBtnMsgEl = this.dom.querySelector('.ue-whatsapp-chat-popup-message-input textarea');
                const sendBtnMsg = encodeURIComponent(sendBtnMsgEl.value);
                const sendBtnLink = btnEl.getAttribute('href') + '/?text=' + sendBtnMsg;
                btnEl.setAttribute('href', sendBtnLink );
                break;
            case 'agents': 
                const agentsMsgEl = this.dom.querySelector('.ue-whatsapp-chat-agent-details-message');
                const agentsMsg = encodeURIComponent(agentsMsgEl.textContent);
                const agentsSendLink = btnEl.getAttribute('href') + '/?text=' + agentsMsg;
                btnEl.setAttribute('href', agentsSendLink );
                break;
            default:
                const msgEl = this.dom.querySelector('.ue-whatsapp-chat-popup-message-input textarea');
                const sendMsg = encodeURIComponent(msgEl.value);
                const sendLink = btnEl.getAttribute('href') + '/?text=' + sendMsg;
                btnEl.setAttribute('href', sendLink );
                break;
        }
        
        
    }

    showMessageContainer = (btnEl) => {

        const msgEl = btnEl.querySelector('.ue-whatsapp-chat-popup-agents-message-text');
        this.sendMsgArea.placeholder = '';
        this.sendMsgArea.placeholder = msgEl.textContent;
        btnEl.classList.add('uc_active');
        this.dom.querySelectorAll('.ue-whatsapp-chat-agent:not(.uc_active)').forEach( (agent) => {
            agent.style.display = 'none';
        });
		this.dom.querySelector('.ue-whatsapp-chat-popup-message-text').classList.add('uc_hide');
        this.sendMsgContainer.classList.add('uc_show');
		const backMsgBtn = btnEl.querySelector('.ue-whatsapp-chat-popup-agents-message-container-backBtn');
        this.sendMsgBtn.setAttribute('href', btnEl.getAttribute('href'));
        /* back button handler */
        backMsgBtn.addEventListener('click', (event) => { this.hideMessageContainer(event, btnEl) })
    }

    hideMessageContainer = (event, btnEl) => {
        event.stopPropagation();
        event.preventDefault();
        this.sendMsgContainer.classList.remove('uc_show');
        btnEl.classList.remove('uc_active');
        this.dom.querySelectorAll('.ue-whatsapp-chat-agent').forEach( (agent) => {
            agent.style.display = 'flex'
        });
      	this.dom.querySelector('.ue-whatsapp-chat-popup-message-text').classList.remove('uc_hide');
    }

    initEvents = () => {
        const closeBtn = this.dom.querySelector('.ue-whatsapp-chat-popup-title-close');
        const sendBtn = this.dom.querySelector('.ue-whatsapp-chat-button');
        closeBtn.addEventListener('click', this.onChatCLoseClick);
        sendBtn.addEventListener('click', this.onChatBtnClick);
    }

    onChatCLoseClick = () => {
        this.popup.classList.toggle('uc-show');
        /* set cache expriry if applicable */
        if(this.openByDefault === 'true' && this.cacheState === 'true') {
            
            if(this.item.show === 'true') {
                const newItem = {
                    show: "false",
                    expiry: this.storageItem.expiry,
                }
                localStorage.setItem(this.storageKey, JSON.stringify(newItem));	
            }
        }
    }

    onChatBtnClick = (event) => {
		
		// Get Bounds
		const bounds = this.popup.getBoundingClientRect()
        const chatButton = this.dom.querySelector('.ue-whatsapp-chat-button')
		const chatBtnHeight = chatButton.getBoundingClientRect().height
        
		if(this.type != 'only_button'){

            chatButton.style.pointerEvents = `none`
            setTimeout( () => {
               chatButton.style.pointerEvents = ``
            }, 700)

			if( this.placement.includes('left') ) {

				if ( bounds.left < 0 ) { this.popup.style.left = 0 }
            } else {                    
              if ( bounds.right > window.innerWidth ) { 
                  this.popup.style.left = `-${bounds.width - (chatBtnHeight/2)}px`
              } 
			}

        	if( this.placement.includes('bottom') ) {
              if ( bounds.bottom + 50 > window.innerHeight ) {

				  this.popup.style.top = `-${chatBtnHeight + bounds.height}px`
				  this.popup.classList.toggle('uc-show'); 
              } else {

                this.popup.classList.toggle('uc-show');
				setTimeout( () => {
					this.popup.style.top = `${10 + chatBtnHeight}px`
				}, 600)
              }
			} else {
                if ( bounds.top - 50 < 0 ) {

                    this.popup.style.bottom = `-${chatBtnHeight + bounds.height}px`
                    this.popup.classList.toggle('uc-show')
                } else {

                    this.popup.classList.toggle('uc-show');
                    setTimeout( () => {
						
						this.popup.style.bottom = `${10 + chatBtnHeight}px`
					}, 600)
                }
            }      
        }           
    }

    onAgentSendBtnClick = () => {
        const sendMsg = encodeURIComponent(this.sendMsgArea.value);
        const sendLink = this.sendMsgBtn.getAttribute('href') + '/?text=' + sendMsg;
        this.sendMsgBtn.setAttribute('href', sendLink );
    }
}