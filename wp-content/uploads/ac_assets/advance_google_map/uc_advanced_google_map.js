class UeGoogleMapWidget {
	
	constructor(options) {
		
		try{
			
			
			this.dom = options.dom;
			this.assetsURL = options.assetsURL;
			this.geocoder = new google.maps.Geocoder();
			this.mapType = options.mapType;
			this.mapOptions = options.mapOptions;
			this.mapControls = options.mapControls;
			this.markers = options.markers;
			this.infoWindowOptions = options.infoWindowOptions;
			this.infoWindowContent = options.infoWindowContent;
			this.finderTool = options.finderTool;
			this.defaultMarker = options.defaultMarker;
			this.options = options;
			this.markersObjects = [];
			this.clustering = options.clustering;
			this.navigation = options.navigation;
			this.places = [];
			this.finderLocalStorage = {
				latitude: '',
				longitude: '',
				address: '',
				notes: '',
				zoom: ''
			}
			this.errorOverlay = options.errorOverlay
			this.loader = options.loader
			this.breakpoint = options.breakpoint
			this.container = options.container
			this.isEditMode = options.isEditMode	
			this.isRefreshed = options.isRefreshed
			
			if ( this.finderTool.show ) {
				
				if (this.navigation && this.navigation.placesWrapper) {
					this.navigation.placesWrapper.style.opacity = 1
				}
			}
			
			switch (options.mapStyleCategory) {
				case 'custom':
				this.mapStyle = options.mapStyle;
				this.init()
				break;
				case 'google':
				if (options.mapStyle) {
					this.setStyle(options.mapStyle)
				} else {
					this.mapStyle = options.mapStyle;
					this.init()
				}
				break;
				default:
				this.mapStyle = options.mapStyle;
				this.init()
				break;
			}
			
		}catch(error){
			
			this.showErrorMessage(error);    	  
		}
		
	}
	
	/**
	* console.log some string
	*/
	trace(){
		
		console.log(str);
	}
	
	/**
	* set map style
	*/
	showErrorMessage(message){
		
		console.log(message);
		
		var objWrapper = jQuery(this.dom);
		var objParent = objWrapper.parents(".ue-google-map");
		
		var objError = objParent.find(".uc-map-error-message");
		
		if(objError.length == 0){
			objParent.append("<div class='.uc-map-error-message'></div>");
			var objError = objParent.find(".uc-map-error-message");
		}
		
		if(typeof message != "string")
			message = message.toString();
		
		objError.html(message);
		
	}
	
	
	/**
	* set map style
	*/
	setStyle(){
		fetch(options.mapStyle)
		.then((response) => {
			return response.json();
		})
		.then((data) => {
			this.mapStyle = data
			this.init()
		})
		.catch((err) => {
			console.log("Unable to fetch map style!", err);
		});
	}
	
	
	/*
	** Init 
	*/
	init(){
		
		if(this.isRefreshed) {
			
			this.mapOptions.center.lat = parseFloat(this.markers[0].marker_latitude)
			this.mapOptions.center.lng = parseFloat(this.markers[0].marker_longitude)
		} 
		
		if (!this.mapOptions.center.lat || !this.mapOptions.center.lng ) {
			
			this.geocodeAddress(this.mapOptions.address, (location) => {
				this.mapOptions.center.lat = location.position.lat();
				this.mapOptions.center.lng = location.position.lng();
				this.createMap();
				//this.initOptionals();
			});
			
		} else {
			this.createMap();
			//this.initOptionals();
		}
		
		if (this.navigation && this.navigation.showPlaces) {
			this.initPlacesNavigation();
		}
		
		this.initEvents()
	}
	
	initOptionals(){
		
		try{
			
			if (this.clustering.show) {
				this.initMarkerClusters()
			}
			
			if (this.finderTool.show ) {
				
				if ( this.isEditMode ) {
					
					this.getFinderToolLocalStorage();
					
					if (this.finderLocalStorage.latitude) {
						this.updateFinderToolFields(this.finderLocalStorage.latitude, this.finderLocalStorage.longitude, this.finderLocalStorage.address, this.finderLocalStorage.notes, this.finderLocalStorage.zoom);
						this.setDebugMarker( parseFloat(this.finderLocalStorage.latitude), parseFloat(this.finderLocalStorage.longitude) );
						this.map.setCenter({ lat: parseFloat(this.finderLocalStorage.latitude), lng: parseFloat(this.finderLocalStorage.longitude) });
						this.map.setZoom(parseInt(this.finderLocalStorage.zoom, 10))
					} else {
						this.finderTool.zoomEl.value = this.mapOptions.zoom
					}
				}
				
				this.updateFinderToolCurrentLocationFields()
				this.initFinderToolEvents();
			}
			
			
		}catch(error){
			this.showErrorMessage(error);
		}  
		
	}
	
	/*
	** Geocode Address 
	*/
	geocodeAddress(address, callback){
		this.geocoder.geocode({ 'address': address }, (results, status) => {
			if (status == 'OK') {
				const location = {
					position: results[0].geometry.location,
					address
				}
				callback(location);
			} else {
				this.errorOverlay.geocodedValueEl.textContent = address;
				this.errorOverlay.statusEl.textContent = status;
				this.errorOverlay.wrapper.style.display = 'flex';
				this.errorOverlay.closeButton.addEventListener('click', (e) => {
					e.preventDefault()
					this.errorOverlay.wrapper.style.display = 'none'
				})
			}
			
		});
		
	}
	
	
	/*
	** Geocode position
	*/
	geocodePosition(position, callback){
		this.geocoder.geocode({ latLng: position }, (results, status) => {
			if (status == 'OK') {
				const location = {
					position: results[0].geometry.location,
					address: results[0].formatted_address
				}
				callback(location);
			} else {
				this.errorOverlay.geocodedValueEl.textContent = position;
				this.errorOverlay.statusEl.textContent = status;
				this.errorOverlay.wrapper.style.display = 'flex';
				this.errorOverlay.closeButton.addEventListener('click', (e) => {
					e.preventDefault()
					this.errorOverlay.wrapper.style.display = 'none'
				})
			}
		});
	}
	
	/*
	** Create Map
	*/
	createMap(){
		
		try{
			
			
			
			var mapZoom = this.mapOptions.zoom;
			
			if(!mapZoom){
				throw new Error("Please set initial map zoom");
			}
			
			if (this.mapControls.mapTypeControlOptions.style === 'dropdown') {
				this.mapControls.mapTypeControlOptions.style = google.maps.MapTypeControlStyle.DROPDOWN_MENU;
			} else {
				this.mapControls.mapTypeControlOptions.style = google.maps.MapTypeControlStyle.HORIZONTAL_BAR;
			}
			
			var mapOptions = {
				zoom: mapZoom,
				center: this.mapOptions.center,
				zoomControl: this.mapControls.zoomControl,
				mapTypeControl: this.mapControls.mapTypeControl,
				mapTypeControlOptions: this.mapControls.mapTypeControlOptions,
				mapTypeId: this.mapType,
				scaleControl: this.mapControls.scaleControl,
				streetViewControl: this.mapControls.streetViewControl,
				rotateControl: this.mapControls.rotateControl,
				fullscreenControl: this.mapControls.fullscreenControl,
				styles: this.mapStyle,
				scrollwheel: this.mapControls.scrollwheel,
				tilt: 45,
			};
			
			
			this.map = new google.maps.Map(this.dom, mapOptions);
			
			
			google.maps.event.addListenerOnce(this.map, 'tilesloaded', () => {
				
				this.initOptionals();
				this.resizeMap()
				this.loader.style.transform = 'scaleX(0)';
				
			});
			
			this.initMarkers()
			
			
			
			if ( this.infoWindowOptions.openByDefault) {
				const item = this.places.find( ( { item_type } ) => item_type == 'place')
				new google.maps.event.trigger(item.marker, 'click');
				this.map.setZoom(parseInt(item.zoom), 10);
			}
			
			
		}catch(error){
			
			this.showErrorMessage(error);
			
		}
		
	}
	
	/**
	* init all markers
	*/
	initMarkers(){
		
		this.markers.forEach((marker, index) => {
			
			try{
				
				this.addMarker(marker, index);
				
			}catch(Error){
				this.showErrorMessage(Error);
			}
			
		});
	}
	
	setMarkerIcon(marker){
		
		switch (marker.icon_type) {
			default:
			case 'default': {
				
				return this.setMarkerIcon(this.defaultMarker);
			}
			
			case 'from_list': {
				return this.constructMarkerListIconUrl(marker);
			}
			
			case 'custom_image': {
				return marker.marker_custom_icon;
			}
			
			case 'ue_svg': {
				return this.assetsURL + marker.ue_svg_marker;
			}
		}
		
	}
	
	constructMarkerListIconUrl(marker){
		
		const urlBase = "https://maps.gstatic.com/mapfiles/";
		
		
		switch (marker.marker_list_icon) {
			
			case "red_with_letter":
			
			return `${urlBase}marker${marker.icon_letter}.png`;
			
			case "green_with_letter":
			
			return `${urlBase}markers/marker_green${marker.icon_letter}.png`;
			
			case "circle_with_letter":
			
			return `${urlBase}circle${marker.icon_letter}.png`;
			
			case "yellow_with_letter":
			
			return `${urlBase}markers/marker_yellow${marker.icon_letter}.png`;
			
			default:
			
			return `${urlBase + marker.marker_list_icon}.png`;
			
		}
	}
	
	
	/**
	* add marker
	*/
	addMarker(marker, index){
		
		marker.item_index = index + 1
		var markerTitle = marker.title;
		
		//set marker position
		
		var isCategory = (marker.item_type == 'category');
		var error;
		
		if (marker.coordinates_type == 'map_center') {
			var position = this.mapOptions.center;
		}else{
			
			var markerLat = parseFloat(marker.marker_latitude);
			var markerLong = parseFloat(marker.marker_longitude);
			
			if(isNaN(markerLat)){
				error = "Missing longitude in "+markerTitle+" marker";
			}
			
			if(isNaN(markerLong)){
				error = "Missing longitude in "+markerTitle+" marker";	    		  
			}
			
			var position = { lat: markerLat, lng: markerLong };
		}
		
		if(error && isCategory == false)
			throw new Error(error);
		
		if(error && isCategory == true)
			return(false);
		
		let markerOptions = {
			position: position,
			map: this.map,
			title: markerTitle
		}
		
		if (this.defaultMarker.animate_marker) {
			markerOptions.animation = google.maps.Animation.DROP
		}
		
		
		if ( marker.item_type == 'place' ) {
			const iconURL = this.setMarkerIcon(marker);
			
			if (iconURL) {
				let icon = {
					url: iconURL,
					origin: new google.maps.Point(0, 0),
				}
				
				markerOptions.icon = icon
				
				const iconWidth = parseInt(this.defaultMarker.marker_width_nounit, 10)
				const iconHeight = parseInt(this.defaultMarker.marker_height_nounit, 10)
				
				if ((marker.icon_type == 'custom_image' || marker.icon_type == 'ue_svg') || (marker.icon_type == 'default' && this.defaultMarker.icon_type == 'custom_image' || this.defaultMarker.icon_type == 'ue_svg')) {
					icon.scaledSize = new google.maps.Size(iconWidth, iconHeight)
				} else if ((this.defaultMarker.icon_type == 'from_list' && this.defaultMarker.default_marker_icon == 'default') || (marker.icon_type == 'from_list' && marker.marker_list_icon == 'default')) {
					icon.scaledSize = new google.maps.Size(19, 25)
				}
				
			}
		}
		
		if (marker.item_type == 'category') {
			markerOptions.visible = false
			markerOptions.opacity = 0
		}
		
		const lclMarker = new google.maps.Marker(markerOptions);
		
		
		if ( marker.item_type == 'place' ) {
			/* set Info Window */
			if (this.infoWindowOptions.showInfoWindow) {
				this.setMarkerInfoWindow(lclMarker, index);
			}
			this.markersObjects.push(lclMarker);
		}
		
		
		/* set Navigator data */
		const place = {
			item_index:  marker.item_index,
			category_index: marker.category_index, 
			marker: lclMarker,
			zoom: marker.zoom_level,
			item_type: marker.item_type
		}
		
		this.places.push(place);
		
	}
	
	/*
	** set marker info window 
	*/
	setMarkerInfoWindow(lclMarker, index){
		
		//set onclick event
		lclMarker.addListener('click', () => {
			
			const infoWindow = new google.maps.InfoWindow({
				content: this.infoWindowContent[index],
				maxWidth: this.infoWindowOptions.maxWidth,
				maxHeight: this.infoWindowOptions.maxHeight,
				position: lclMarker.getPosition()
			});
			
			if (this.openedInfoWindow) { this.openedInfoWindow.close(); }
			
			infoWindow.open({
				anchor: lclMarker,
				map: this.map
			});
			
			if (this.infoWindowOptions.centerInfoWindow) { this.map.setCenter(lclMarker.position) }
			
			this.openedInfoWindow = infoWindow;
			
			if(this.navigation){
				this.navigation.places.forEach((element) => {
					
					
					if ( element.getAttribute('data-item_index') != index + 1) {
						element.classList.remove('ue_active')
					}
					if (element.getAttribute('data-item_index') == index + 1) {
						element.classList.add('ue_active')
					}
				})
			}
			
		}); 
	}
	
	
	/*
	** copy to clipboard
	*/
	copyToClipboard(el){
		el.select();
		document.execCommand("copy");
	}
	
	updateFinderToolFields(latitude, longitude, address, notes, zoom) {
		this.finderTool.latitudeEl.value = latitude;
		this.finderTool.longitudeEl.value = longitude;
		this.finderTool.addressEl.value = address;
		this.finderTool.notesEl.value = notes;
		this.finderTool.zoomEl.value = zoom;
		
		if ( this.isEditMode ) {
			this.updateFinderToolLocalStorage({
				latitude,
				longitude,
				address,
				notes,
				zoom
			});
		}
		
	}
	
	/*
	** set the debug marker
	*/
	setDebugMarker(lat, lng){
		
		if (this.debugMarker) this.debugMarker.setMap(null);
		this.debugMarker = new google.maps.Marker({
			map: this.map,
			size: new google.maps.Size(30, 30),
			draggable: true,
			position: { lat, lng },
			icon: this.finderTool.debugMarkerIcon
		});
		
		google.maps.event.addListener(this.debugMarker, 'dragend', () => {
			this.geocodePosition(this.debugMarker.getPosition(), (location) => {
				this.updateFinderToolFields(location.position.lat(), location.position.lng(), location.address, this.finderTool.notesEl.value, this.finderTool.zoomEl.value);
				this.map.setCenter(location.position)
			});
		});
		
		// set toggle events
		this.finderTool.markerToggleEl.addEventListener('click', e => {
			
			if( this.finderTool.markerToggleEl.classList.contains('uc_active') ) {
				this.finderTool.markerToggleEl.classList.remove('uc_active')
				this.debugMarker.setVisible(true)
			} else {
				this.finderTool.markerToggleEl.classList.add('uc_active')
				this.debugMarker.setVisible(false)
			}
		})
	}
	
	onFinderToolAddressSearch(address, notes, zoom){
		this.geocodeAddress(address, (location) => {
			this.updateFinderToolFields(location.position.lat(), location.position.lng(), location.address, notes, zoom);
			this.setDebugMarker(location.position.lat(), location.position.lng());
			this.map.setCenter(location.position);
		});
	}
	
	onFinderToolPositionSearch(position, notes, zoom){
		this.geocodePosition(position, (location) => {
			
			this.updateFinderToolFields(location.position.lat(), location.position.lng(), location.address, notes, zoom);
			this.setDebugMarker(location.position.lat(), location.position.lng());
			this.map.setCenter(location.position);
		});
	}
	
	initFinderToolEvents(){
		
		this.finderTool.copyIcons.forEach((copyIcon) => {
			
			copyIcon.addEventListener('click', (e) => {
				switch (e.target.getAttribute('data-copy')) {
					case 'latitude':
					this.copyToClipboard(this.finderTool.latitudeEl);
					break;
					case 'longitude':
					this.copyToClipboard(this.finderTool.longitudeEl);
					break;
					case 'adrress':
					this.copyToClipboard(this.finderTool.addressEl);
					break;	
					case 'current-latitude':
					this.copyToClipboard(this.finderTool.currentLatitudeEl);
					break;
					case 'current-longitude':
					this.copyToClipboard(this.finderTool.currentLongitudeEl);
					break;
					default:
					break;
				}
			});
			
		});
		
		this.finderTool.addressBtnEl.addEventListener('click', (e) => {
			
			this.onFinderToolAddressSearch(this.finderTool.addressEl.value, this.finderTool.notesEl.value, this.finderTool.zoomEl.value);
			
		});
		
		this.finderTool.addressBtnEl.addEventListener('keyup', (e) => {
			
			if (e.key == 'Enter') {
				this.onFinderToolAddressSearch(this.finderTool.addressEl.value, this.finderTool.notesEl.value, this.finderTool.zoomEl.value);
			}
			
		});
		
		this.finderTool.addressEl.addEventListener('keyup', (e) => {
			if (e.key == 'Enter') {
				this.onFinderToolAddressSearch(this.finderTool.addressEl.value, this.finderTool.notesEl.value, this.finderTool.zoomEl.value);
			}
		});
		
		this.finderTool.geocodeCoordinatesIcon.addEventListener('click', (e) => {
			this.onFinderToolPositionSearch({
				lat: parseFloat(this.finderTool.latitudeEl.value),
				lng: parseFloat(this.finderTool.longitudeEl.value)
			},
			this.finderTool.notesEl.value,
			this.finderTool.zoomEl.value)
		});
		
		this.finderTool.notesEl.addEventListener('keyup', (e) => {
			this.updateFinderToolFields(
				this.finderTool.latitudeEl.value,
				this.finderTool.longitudeEl.value,
				this.finderTool.addressEl.value,
				e.target.value,
				this.finderTool.zoomEl.value,
			)
		})
		
		this.finderTool.zoomEl.addEventListener('change', (e) => {
			this.map.setZoom(parseInt(e.target.value, 10))
			console.log('test')
			this.updateFinderToolFields(
				this.finderTool.latitudeEl.value,
				this.finderTool.longitudeEl.value,
				this.finderTool.addressEl.value,
				this.finderTool.notesEl.value,
				e.target.value
			)
		})
		
		this.finderTool.currentWrapperToggle.addEventListener('click', () => {
			if ( this.finderTool.currentWrapper.style.display != 'flex' ) {
				this.finderTool.currentWrapper.style.display = 'flex'
				//this.updateWrappersHeight()
			} else {
				this.finderTool.currentWrapper.style.display = 'none'
				//this.updateWrappersHeight()
			}
		})
		
		this.map.addListener("center_changed", () => {
			this.updateFinderToolCurrentLocationFields()
		})
		
		this.map.addListener("zoom_changed", () => {
			
			this.updateFinderToolCurrentLocationFields();
			
		})
		
	}
	
	updateFinderToolCurrentLocationFields(){
		
		const center = this.map.getCenter();
		this.finderTool.currentLatitudeEl.value = center.lat()
		this.finderTool.currentLongitudeEl.value = center.lng()
		
		var currentZoom = this.map.getZoom();
		
		if(!currentZoom)
			currentZoom = this.mapOptions.zoom;
		
		this.finderTool.zoomEl.value = currentZoom;
		
	}
	
	initMarkerClusters(){
		
		this.markerCluster = new MarkerClusterer(this.map, this.markersObjects,
			{
				imagePath: `${this.clustering.imagesPath}/m`,
				ignoreHidden: true,
				gridSize: this.clustering.gridSize,
				maxZoom: this.clustering.maxZoom
			}
		);
		
	}
	
	initPlacesNavigation(){
		
		if ( this.navigation.showSearch) {
			this.initSearchPlacesEvent()
		}
		
		if ( this.navigation.showReset ) {
			this.navigation.resetButton.addEventListener('click', () => {
				this.map.setZoom(parseInt(this.mapOptions.zoom, 10))
				this.map.setCenter({lat: parseFloat(this.mapOptions.center.lat), lng: parseFloat(this.mapOptions.center.lng)})
			})
		}
		
		if ( this.navigation.showPlaces) {
			this.navigation.places.forEach((place) => {
				this.initPlacesEvents(place)
			})
		}
		
		// this.initShowPlacesToggle()
		
		
	}
	
	removePlacesToggleHandler() {
		this.navigation.placesToggle.removeEventListener('click', this.togglePlacesHandler)
	}
	
	initShowPlacesToggle(){
		if(!this.navigation)
			return(false);
		
		const toggleDisplay = window.getComputedStyle(this.navigation.placesToggle).getPropertyValue('display')
		
		if ( this.isRefreshed || toggleDisplay == 'flex' ) {
			this.togglePlacesHandler = this.togglePlacesWrapper.bind(this)
			
			this.removePlacesToggleHandler() ;
			this.navigation.placesToggle.addEventListener('click', this.togglePlacesHandler)
			
		}
	}
	
	togglePlacesWrapper(){
		
		if ( window.innerWidth <= this.breakpoint ) {
			
			if (this.navigation && this.navigation.placesWrapper && this.navigation.placesWrapper.classList.contains('uc_active') ) {
				this.navigation.placesWrapper.classList.remove('uc_active');
				this.navigation.placesToggle.classList.remove('uc_active');
				const closeText = this.navigation.placesToggle.getAttribute('data-open-text');
				this.navigation.placesToggleText.textContent = closeText;                                	
			} else {
				this.navigation.placesWrapper.classList.add('uc_active');
				this.navigation.placesToggle.classList.add('uc_active');
				const openText = this.navigation.placesToggle.getAttribute('data-close-text');
				this.navigation.placesToggleText.textContent = openText;                                 
			}
		} 
		
	}
	
	resizeMap() {
		
		if ( window.innerWidth <= this.breakpoint && this.navigation.showPlaces) {
			const parentHeight = this.dom.parentNode.getBoundingClientRect().height
			const mapHeight = this.dom.getBoundingClientRect().height
			const toggleHeight = this.navigation.placesToggle.getBoundingClientRect().height
			const togglePosition = this.navigation.placesToggle.getAttribute('data-pos');
			if ( mapHeight == parentHeight ) {
				this.dom.style.height = `${mapHeight-toggleHeight}px`  
				if(togglePosition == "top")
					this.dom.style.marginTop = "auto"
			}
		} else {
			this.dom.style.height = '100%'
		}
	}
	
	initSearchPlacesEvent(){
		
		if(!this.navigation)
			return(false);
		
		this.navigation.searchInput.addEventListener('keyup', (e) => {
			this.filterPlaces(e.target.value);
		})
		
		this.navigation.searchIcon.addEventListener('click', (e) => {
			this.filterPlaces(this.navigation.searchInput.value);
		})
	}
	
	initPlacesEvents(place){
		
		const type = place.getAttribute('data-item-type');
		
		if ( type == 'category' ) {
			
			const titleWrapper = place.querySelector(this.navigation.categoryTitleWrapperClass);
			const title = place.querySelector(this.navigation.categoryTitleClass);
			const checkbox = place.querySelector(this.navigation.categoryCheckboxClass);
			const toggles = place.querySelectorAll(this.navigation.categoryToggleClass);
			const placeIndex = place.getAttribute('data-item_index');
			const placeMarker = this.places.find( ( { item_index } ) => item_index == placeIndex)
			
			if ( placeMarker  ) {
				placeMarker.marker.visible = false
			}
			
			title.addEventListener('click', () => {
				
				this.togglePlacesWrapper()
				
				const index = place.getAttribute('data-item_index');
				const item = this.places.find( ( { item_index } ) => item_index == index)
				
				if ( item.marker.position.lat() ) {
					
					this.map.setCenter(item.marker.position)
					this.map.setZoom(parseInt(item.zoom), 10);
					
				}
			})
			
			toggles.forEach( toggle => {
				
				const toggleDisplay = window.getComputedStyle(this.navigation.placesToggle).getPropertyValue('display')
				
				if ( toggleDisplay == 'flex' ) {
					this.togglePlacesWrapper()
				}
				
				// init collapse state
				const placeItems = place.querySelector(this.navigation.placeItemsClass);
				if ( toggle.parentElement.classList.contains('ue_active') ) {
					placeItems.style.maxHeight = `${placeItems.scrollHeight}px`          	
				} else {
					placeItems.style.maxHeight = 0
				}
				
				toggle.addEventListener('click', () => {
					
					const items = place.querySelector(this.navigation.placeItemsClass);
					
					if ( toggle.parentElement.classList.contains('ue_active') ) {
						toggle.parentElement.classList.remove('ue_active')
						items.style.maxHeight = 0
					} else {
						items.style.maxHeight = `${items.scrollHeight}px`
						toggle.parentElement.classList.add('ue_active')
					}
				})
				
				if ( toggleDisplay == 'flex' ) {
					this.togglePlacesWrapper()
				}
				
			})
			
			var toggleElement = checkbox;
			
			if(toggleElement == null)
				toggleElement = titleWrapper;
			
			toggleElement.addEventListener('click', () => {
				
				const categoryIndex = place.getAttribute('data-category-index');
				const items = this.places.filter( ( { category_index } ) => category_index == categoryIndex)
				
				
				items.forEach( item => {
					if ( item.item_type == 'category' ) {
						return
					}
					if ( item.marker.getVisible() ) {
						item.marker.setVisible(false)
					} else {
						item.marker.setVisible(true)
					}
				})
				
			})
			
			
		} else {
			
			place.addEventListener('click', (e) => {
				
				this.togglePlacesWrapper()
				
				const index = place.getAttribute('data-item_index')
				
				this.navigation.places.forEach((element) => {
					
					if (place.classList.contains('ue_active') || element.getAttribute('data-item_index') != index) {
						element.classList.remove('ue_active')
					}
					if (element.getAttribute('data-item_index') === index) {
						element.classList.add('ue_active')
					}
				})
				
				const item = this.places.find(p => p.item_index == index)
				
				
				if ( item.marker.getVisible() ) {
					new google.maps.event.trigger(item.marker, 'click');
					this.map.setZoom(parseInt(item.zoom), 10);
				}
			})
			
			place.addEventListener('mouseenter', (e) => {
				
				const index = place.getAttribute('data-item_index')
				const marker = this.places.find(p => p.item_index == index).marker
				
				if ( marker.getVisible() ) {
					marker.setAnimation(4)
				}	
			})
			
			place.addEventListener('mouseleave', (e) => {
				
				const index = place.getAttribute('data-item_index')
				const marker = this.places.find(p => p.item_index == index).marker
				
				if ( marker.getVisible() ) {
					marker.setAnimation(null)
				}
			})
		}
	}
	
	filterPlaces(filter){
		
		
		
		this.navigation.places.forEach((place) => {
			
			const title = place.querySelector('.ue-maps-navigator-item-label').textContent;
			const subtitle = place.querySelector('.ue-maps-navigator-item-sub-title').textContent;
			
			if ( (title.toLowerCase().search(filter.toLowerCase()) != -1) || (subtitle.toLowerCase().search(filter.toLowerCase()) != -1) ) {

				place.style.display = 'flex'
				/* if ( place.getAttribute('data-item-type') == 'place' ) {
				place.parentNode.parentNode.style.display = 'flex'
				} */
				// if (place.getAttribute('data-category-index') != 'null') {
				// 	place.parentNode.parentNode.style.display = 'flex'
				// }
			} else {
				place.style.display = 'none'
			}
		})
	}
	
	updateFinderToolLocalStorage(finderData) {
		localStorage.setItem('UeGoogleMapFinderData', JSON.stringify(finderData))
		this.finderLocalStorage = JSON.parse(localStorage.getItem('UeGoogleMapFinderData'));
	}
	
	getFinderToolLocalStorage() {
		if (!this.finderLocalStorage.latitude) {
			const cookie = JSON.parse(localStorage.getItem('UeGoogleMapFinderData'));
			if (cookie != null) {
				this.finderLocalStorage = JSON.parse(localStorage.getItem('UeGoogleMapFinderData'));
			}
		}
	}
	
	initEvents() {
		this.initShowPlacesToggle()
		window.addEventListener('resize', () => {
			this.resizeMap()
			
		})
	}
	
}