"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const { phantasmaJS } = require('phantasma-ts');
var fs = require('fs');
var elliptic_1 = require("elliptic");
var ed25519 = new elliptic_1.eddsa("ed25519");
/*Input file that is relative to the directory*/
function fileConv(file) {
    let fileHex = fs.readFileSync(file, 'utf8');
    let hexArr = new Uint8Array(Buffer.from(fileHex, 'hex'));
    //return hexArr;
    console.log(hexArr);
    console.log(Buffer.from(hexArr).toString('hex').toUpperCase());
    //return fileHex;
}
function testKeys() {
    return __awaiter(this, void 0, void 0, function* () {
        let wif = 'KxMn2TgXukYaNXx7tEdjh7qB2YaMgeuKy47j4rvKigHhBuZWeP3r';
        let testKey = phantasmaJS.PhantasmaKeys.fromWIF(wif);
        //let utf8decoder = new TextDecoder()
        //console.log(typeof testKey.PrivateKey);
        //console.log(testKey.PublicKey);
        let privKey = testKey.PrivateKey.toString().replace(/\,/g, '');
        //console.log('test key: ' + testKey);
        //let privateKeyBuffer = (Buffer.from(privateKey, "hex"));
        //let publicKey= ed25519.keyFromSecret(privateKeyBuffer).getPublic();
        //console.log(publicKey.length);
        //let keys = phantasmaJS.PhantasmaKeys(privateKey);
    });
}
function getTransaction(transaction) {
    return __awaiter(this, void 0, void 0, function* () {
        let host = 'http://localhost:7077/rpc';
        let nexus = 'simnet';
        let RPC = new phantasmaJS.PhantasmaAPI(host, undefined, nexus);
        let data = yield RPC.getTransaction(transaction);
        //let tokens = await RPC.getTokens();
    });
}
function deployContract(abi_file, pvm_file) {
    return __awaiter(this, void 0, void 0, function* () {
        //Wallet Stuff
        let wif = 'KxMn2TgXukYaNXx7tEdjh7qB2YaMgeuKy47j4rvKigHhBuZWeP3r';
        let fromAddress = 'P2K9zmyFDNGN6n6hHiTUAz6jqn29s5G1SWLiXwCVQcpHcQb';
        //let testKey = phantasmaJS.PhantasmaKeys.fromWIF(wif);
        //let privKey = testKey.PrivateKey.toString().replace(/\,/g,'');
        let host = 'http://localhost:7077/rpc';
        let nexus = 'simnet';
        //Contract Stuff 
        console.log("Setting Contract variables");
        let pvm = fileConv(pvm_file); //'PVM HEX String';
        let abi = fileConv(abi_file); //'ABI HEX String';
        let gasPrice = 10000000;
        let gasLimit = 21000000;
        let contractName = 'rand'; //Whatever you want
        //Creating a new Script Builder Object
        let sb = new phantasmaJS.ScriptBuilder();
        //New RPC and Peers Needed
        let RPC = new phantasmaJS.PhantasmaAPI(host, undefined, nexus);
        //Making a Script
        console.log("Creating Script");
        console.log("Allow Gas");
        sb.AllowGas(fromAddress, sb.NullAddress, gasPrice, gasLimit);
        console.log("Interop");
        //address, contract name, contract.script,contract.abi.ToByteArray()
        sb.CallInterop("Runtime.DeployContract", [fromAddress, contractName, pvm, abi]);
        console.log('sPend gas');
        sb.SpendGas(fromAddress);
        let script = sb.EndScript();
        //Used to set expiration date
        let expiration = 5; //This is in miniutes
        let getTime = new Date();
        let date = new Date((getTime.getTime() + expiration * 60000));
        //Setting Temp Payload
        let payload = "7a";
        console.log("creating Transaction Object");
        //Creating New Transaction Object
        let transaction = new phantasmaJS.Transaction(nexus, //Nexus Name
        'main', //Chain
        script, //In string format
        date, //Date Object
        payload //Extra Info to attach to Transaction in Serialized Hex
        );
        console.log("Mining");
        //Deploying Contract Requires POW -- Use a value of 5 to increase the hash difficulty by at least 5
        transaction.mineTransaction(5);
        console.log("signing");
        //Signs Transaction with your private key
        transaction.sign(wif);
        let transactionSigned = transaction.toString(true);
        //Sends Transaction
        //will have to wrap in async
        console.log("RPC Send Raw");
        let txHash = yield RPC.sendRawTransaction(transactionSigned);
        //Returns Transaction Hash
        console.log("Hash is: " + txHash);
    });
}
function testMethod() {
    return __awaiter(this, void 0, void 0, function* () {
        let rpcUrl = 'http://localhost:7077/rpc';
        let nexus = 'simnet';
        let RPC = new phantasmaJS.PhantasmaAPI(rpcUrl, undefined, nexus);
        let addy = 'P2K9zmyFDNGN6n6hHiTUAz6jqn29s5G1SWLiXwCVQcpHcQb'; //- Node0 of phantasma test accoiunts
        //let acctNum =  RPC.getAccount('P2K9zmyFDNGN6n6hHiTUAz6jqn29s5G1SWLiXwCVQcpHcQb'); //Returns the account name and balance of given address.
        /*The following is script builder*/
        let sb = new phantasmaJS.ScriptBuilder();
        let contractName = 'rand';
        let methodName = 'mutateState';
        let script = sb.AllowGas(addy, sb.NullAddress, 1, 9999).
            CallContract(contractName, methodName, []).
            SpendGas(addy).EndScript();
        let targetNet = 'main';
        let resp = yield RPC.invokeRawScript(targetNet, script);
        console.log("Printing response:" + resp.result);
        const decoder = new phantasmaJS.Decoder(resp.result);
        const value = decoder.readVmObject();
        console.log(value);
    });
}
let transactionHash = '07753E1A0419F8C6636C8BE5D9D5740A6ADA7F9BCC03E1361299F02B8DFF886D';
//getTransaction(transactionHash);
//testMethod();
//let relative_path = '../../../Smart-Contracts/Phantasma-Contracts-main/SmartContract/Random/Output/';
let abi_file = '../../../Smart-Contracts/Phantasma-Contracts-main/SmartContract/Random/Output/rand.abi.hex';
let pvm_file = '../../../Smart-Contracts/Phantasma-Contracts-main/SmartContract/Random/Output/rand.pvm.hex';
fileConv(abi_file);
fileConv(pvm_file);
//deployContract(abi_file,pvm_file);
//testKeys();
