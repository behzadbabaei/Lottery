const ganache = require('ganache');
const { Web3 } = require('web3');

// updated imports added for convenience

const assert  = require('assert');
const web3 = new Web3(ganache.provider());

const {interface, bytecode} =  require('../compile');


let accounts;
let lottery;

beforeEach(async () => {
    accounts = await web3.eth.getAccounts();
    lottery = await new web3.eth.Contract(JSON.parse(interface))
        .deploy({data: bytecode})
        .send({ from: accounts[0], gas:'1000000'});
});

describe('Lotter Contract', () =>{
    it('deploys the contract', () => {
        assert.ok(lottery.options.address);
    });

    it('allow one to enter lottery', async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('0.01', 'ether')
        });

        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        })

        assert.equal(accounts[0], players[0]);
        assert.equal(1, players.length);
    });

    it('allow multiple to enter lottery', async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('0.01', 'ether')
        });

        await lottery.methods.enter().send({
            from: accounts[1],
            value: web3.utils.toWei('0.01', 'ether')
        });

        await lottery.methods.enter().send({
            from: accounts[2],
            value: web3.utils.toWei('0.01', 'ether')
        });

        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        })

        assert.equal(accounts[0], players[0]);
        assert.equal(accounts[1], players[1]);
        assert.equal(accounts[2], players[2]);
        assert.equal(3, players.length);
    });

    it('requires a minimum amount of ether to enter the lottery', async () => {
        try {
            await lottery.methods.enter().send({
                from: accounts[0],
                value: 100
            });
            assert(false);
        } catch(err) {
            assert.ok(err);
        }
    });

    it('only managger can pick the winner', async () => {
        try {
            await lottery.methods.pickWinner().send({
                from: accounts[1],
            });
            assert(false);
        } catch(err) {
            assert.ok(err);
        }
    });

    it('it sends money to winner and reset the players', async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('2', 'ether')
        });
        
        const initialBalance = await web3.eth.getBalance(accounts[0]);
        
        await lottery.methods.pickWinner().send({from: accounts[0]});
        
        const finalBalance = await web3.eth.getBalance(accounts[0]);
        const difference = finalBalance - initialBalance;
        assert(difference > web3.utils.toWei('1.8', 'ether'));
        
    });
})
