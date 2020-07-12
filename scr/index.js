//Import the page's CSS.Webpack will know what to do with it
import  "./app.css";
//Import libraries we need.
import {default as Web3} from 'web3';
import {default as contract} from 'truffle-contract';
import mudrika_artifacts from '../../build/contracts/Mudrika.json';


var Mudrika = contract(mudrika_artifacts);

const ipfsAPI = require('ipfs-http-client');
const ethUtil = require('ethereumjs-util');

const ipfs = ipfsAPI({host: 'localhost', port: '5001', protocol: 'http'});

window.App = {
  start: function() {
    var self=this;
    EcommerceStore.setProvider(web3.currentProvider);
    renderStore();
    var reader;
  },
};

   $("#product-image").change(function(event){
	const file=event.target.file[0];
	reader=new window.file;
	reader=readArrayasBuffer(file);
});
   $("#add-item-to-store").submit(function(v){
   	const req = $("#add-item-to-store").serialize();
   	let params = JSON.parse('{"'+req.replace(/"/g,'\\"').replace(/&/g,'","').replace(/=/g,'":"')+'"}');
   	let decodeparams = {}
   	   Object.keys(params).forEach(function(v){
      decodedParams[v] = decodeURIComponent(decodeURI(params[v]));
   	  });
   	   saveProduct(reader,decodeparams);
   	   event.preventDefault();
    });
    if($("#product-details").length> 0){
    	//This is   page
    let productId = new URLSearchParams(window.location.search).get('id');
    renderProductionDetails(productId);
    }

    //Place bid
    $("#bidding").submit(function(event){
    	$("#msg").hide();
    	let amount = $("#bid-amount").val();
    	let sendAmount = $("#bid-send-amount").val();
    	let secretText = $("#secret-text").val();
    	let sealedBid = '0x' + ethUtil.sha3(web3.utils.toWei(amount,'ether')+secretText).toString();
    	let productId = $("#product-id").val();
    	console.log(sealedBid +"for"+productId);
    	EcommerceStore.deployed().then(function(i){
    		i.bid(parseInt(productId),sealedBid,{value:web3.utils.toWei(sendAmount),from:web3.eth.accounts[1],gas:440000}).then(
    		function(f){
    			$("#msg").html("Your bid has been successfully submitted!");
    			$("#msg").show();
    			console.log(f);
    		})
    });

    event.preventDefault();
});
$("#revealing").submit(function(event){
	$("#msg").hide();
	let amount = $("#actual-amount").val();
	let secretText = $("#reveal-secret-text").val();
	let productId = $("#product-id").val();
	EcommerceStore.deployed().then(function(i){
		i.revealBid(parseInt(productId),web3.utils.toWei(amount,'ether').toString(),secretText,{from:web3.eth.accounts[1],gas:440000}).then(
         function(f){
         	$("#msg").show();
         	$("#msg").html("Your bid has been succefully revealed !");
         	console.log(f);
         })
	});
	event.preventDefault();
});
   	

   $("#refund-funds").click(function(){
   	let productId = new URLSearchParams(window.location.search).get('id');
   EcommerceStore.deployed().then(function(f){
   	$("#msg").html("Your transaction has been submitted.Please wait for few seconds for the confirmation").show();
   	f.refundAmountToBuyer(productId,{from:web3.eth.accounts[0],gas:440000}).then(function(f) {
   	console.log(f);
   	location.reload();
   	}).catch(function(e){
   		console.log(e);
   	})
   });
   	alert("refund the funds");
   });

   $("#release-funds").click(function(){
   	let productId = new URLSearchParams(window.location.search).get('id');
   	EcommerceStore.deployed().then(function(f){
   	$("#msg").html("Your transaction has been submitted.Please wait for few seconds for the confirmation").show();
   	console.log(productId);
   	f.releaseAmountToSeller(productId,{from:web3.eth.accounts[0],gas:440000}).then(function(f){
   		console.log(f);
   		location.reload();
   	}).catch(function(e) {
   		console.log(e);
   	})
   });
 });

   


    
 




function renderStore(){
  EcommerceStore.deployed().then(function(i){
    i.getProduct.call(1).then(function(product){
      $("#product-list").append(buildProduct(product));
  });
    i.getProduct.call(2).then(function(product){
      $("#product-list").append(buildProduct(product));
  });
   });
}

function buildProduct(product){
  let node = $("<div/>");
  node.addClass("col-sm-3 text-center col-margin-bottom-1");
  node.append("<img src= 'http://localhost:8080/ipfs/" +product[3]+" 'width='150px'/>");
  node.append("<div>"+product[1]+"</div>");
  node.append("<div>"+product[2]+"</div>");
  node.append("<div>"+product[5]+"</div>");
  node.append("<div>"+product[6]+"</div>");
  node.append("<div>Ether" +product[7]+"</div>");
  return node;
}


//IPFS

function saveImageOnIpfs(reader){
	return new Promise(function(resolve,reject){
	const buffer=Buffer.from(reader.result);
	ipfs.add(buffer).then((response)=>{
		console.log(response);
		resolve(response[0].hash);
	}).catch((err)=>{
		console.log(err);
		reject(err);
	})
   })
}
function saveTextBlobOnIpfs(blob){
	return new Promise(function(resolve,reject){
		const descBuffer = Buffer.from(blob,'utf-8');
		ipfs.add(descBuffer).then((response) =>{
			console.log(response);
			resolve(response[0].hash);
		}).catch((err)=>{
		console.log(err);
		reject(err);;
	})
	})
}
//save Product
function saveProduct(reader, decodeparams){
	let imageId, descID;
	saveImageOnIpfs(reader).then(function(id){
		imageId=id;
		saveTextBlobOnIpfs(decodeparams["product-description"]).then(function(id){
			descID =id;
			saveProductToBlockchain(decodedParams, imageID, desID);
		})
	})
}

function saveProductToBlockchain(params, imageId, descID){
  console.log(params);
  let auctionStartTime =Date.parse(params["product-auction-start"]/1000);
  let auctionEndTime = auctionStartTime+parseInt(params["product-auction-end"])*24*60*60;
  EcommerceStore.deployed().then(function(i){
  	i.addProductToStore(params["product-name"],params["product-category"],imageId,descID,auctionStartTime,auctionEndTime,web3.utils.toWei(params[product-price],'ether'),parseInt(params["product-condition"]),{from:web3.eth.accounts[0],gas:440000}).then(function(f){
    console.log(f);
    $("#msg").show();
    $("#msg").html("Your product was successfully added to your store");
    })
  });
}


//fetch product or render product
function renderProductDetails(productId){
	EcommerceStore.deployed().then(function(i){
		i.getProduct.call(productId).then(function(p){
			console.log(p);
			let content="";
			ipfs.cat(p[4]).then(function(file){
				content=file.toString();
				$("#product-desc").append("<div>"+content+"</div");
			});
			$("#product-image").append("<img src='http://localhost:8080/ipfs"+p[3]+"width='250px'/>");
            $("#product-price").html(displayPrice(p[7]));
            $("#product-name").html(p[1].name);
            $("#product-auction-end").html(displayEndHours(p[6]));
            $("#product-id").val(p[0]);
            $("#revealing,#bidding,#finalize-auction","#escrow-info").hide();
            let currentTime = getCurrentTimeInSeconds();
            if(parseInt(p[8])==1){
            	EcommerceStore.deployed().then(function(i){
              $("#escrow-info").show();
              i.highestBidderInfo.call(productId).then(function(f){
              	if(f[2].toLocaleString() == '0'){
              		$("#product-status").html("Auction has ended.No bids were revaled");
              	} else{
              		$("#product-status").html("Auction has ended.Product sold to " +f[0]+"for"+displayPrice(f[2])+"The money is in the escrow.Two of th ethree participants (Buyer,Seller and Arbiter)have to"+
              			"either release the funds to the seller or refund the money to the buyer");
              	}
              })
              i.escrowInfo.call(productId).then(function(f){
              	$("#buyer").html('Buyer:'+f[0]);
              	$("#seller").html('Seller:'+f[1]);
              	$("#arbiter").html('Arbiter:'+f[2]);
              if (f[3]==true){
              	$("release-count").html("Amount from the escrow has been relased");
              }else{
              	$("#release-count").html(f[4]+ "of 3 particpants have agreed to release funds");
                $("#refund-count").html(f[5]+ "of 3 participants have agreed to refund the buyer");
              }
          })
          })
  } else if(parseInt(p[8]) == 2){
    $("#product=status").html("Product was not sold");
  } else if(currentTime<parseInt(p[6])){
  	$("#bidding").show();
  }else if(currentTime<(parseInt(p[6])+600)){
   $("#revealing").show();
  } else{
  	$("#finalize-auction").show();
  }
})
})
}
function getCurrentTimeInSeconds(){
	return Math.round(new Date()/1000);
}

function displayPrice(amt){
	return '1'+web3.utils.fromWei(amt,'ether');
}
function displayEndHours(seconds){
	let current_time = getCurrentTimeInSeconds();
    let remaining_seconds = seconds-current_time;
    if(remaining_seconds<=0){
    	return "Auction has ended";
    }

    let days = Math.trunc(remaining_seconds/(24*60*60));
    remaining_seconds -=  days*24*60*60;
    let hours = Math.trunc(remaining_seconds/(60*60));
    remaining_seconds -= hourse*60*60
    let minutes = Math.trun(remaining_seconds/60);
    
    if(days>0){
    	return "Auction ends in"+days+"days,"+hours+",hours,"+minutes+"minutes";
    } else if(hours>0){
    	return"Auction ends in "+hours+"hours"+minutes+"minutes";
    } else if(minutes>0){
    	return "Auction ends in"+minutes+"minutes";
    } else{
    	return "Auction ends in"+remaining_seconds+"seconds";
    }
}

//Finalise Auction
$("#finalize-auction").submit(function(event){
  $("#msg").hide();
  let productId = $("#product-id").val();
  EcommerceStore.deployed().then(function(i){
    i.finalizeAuction(parseInt(productId),{from:web3.eth.accounts[2],gas: 4400000}).then(
      function(f){
        $("#msg").show();
        $("#msg").html("The auction has been finalized and winner declared");
        console.log(f);
        location.reload();
      }
    
    ).catch(function(e){
      console.log(e);
      $("#msg").show();
      $("#msg").html("The auction can't be finalized by the buyer or seller,only a third party arbiter can finalize it");
    })
      
    });
     event.preventDefault();
  });



window.addEventListener('load', function(){
//checking if web3 has been injected by the browser(Mist/MetaMask)


if (typeof(web3) !== 'undefined') {
  console.warn("Using web3 directed from external source.If you find that your accounts");
  //using Mist/meta Mask provider
  window.web3 = new Web3(web3.currentProvider);
} else{
  console.warn("No web3 detected. Falling back to http://localhost:8545. You should remove");

  window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}
App.start();
});



