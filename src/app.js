App = {
    loading: false,
    contracts: {},

    load: async () => {
        await App.loadWeb3()
        await App.loadAccount()
        await App.loadContract()
        await App.render()
    },

    // https://medium.com/metamask/https-medium-com-metamask-breaking-change-injecting-web3-7722797916a8
    loadWeb3: async () => {
        if (typeof web3 !== 'undefined') {
            App.web3Provider = web3.currentProvider
            web3 = new Web3(web3.currentProvider)
        } else {
            window.alert("Please connect to Metamask.")
        }
        // Modern dapp browsers...
        if (window.ethereum) {
            window.web3 = new Web3(ethereum)
            try {
                // Request account access if needed
                await ethereum.enable()
                // Acccounts now exposed
                web3.eth.sendTransaction({/* ... */ })
            } catch (error) {
                // User denied account access...
            }
        }
        // Legacy dapp browsers...
        else if (window.web3) {
            App.web3Provider = web3.currentProvider
            window.web3 = new Web3(web3.currentProvider)
            // Acccounts always exposed
            web3.eth.sendTransaction({/* ... */ })
        }
        // Non-dapp browsers...
        else {
            console.log('Non-Ethereum browser detected. You should consider trying MetaMask!')
        }
    },

    loadAccount: async () => {
        // Set the current blockchain account
        App.account = web3.eth.accounts[0]
    },

    loadContract: async () => {
        // Create a JavaScript version of the smart contract
        const claims = await $.getJSON('ReportCase.json')
        console.log(claims)
        console.log(await App.contracts)

        App.contracts.ReportCase = TruffleContract(claims)
        App.contracts.ReportCase.setProvider(App.web3Provider)


        // Hydrate the smart contract with values from the blockchain
        App.claims = await App.contracts.ReportCase.deployed()
    },

    render: async () => {
        // Prevent double render
        if (App.loading) {
            return
        }

        // Update app loading state
        App.setLoading(true)

        // Render Account
        $('#account').html(App.account)

        // Render Claims
        await App.renderClaims()

        // Update loading state
        App.setLoading(false)
    },

    // Receive values from the form
    createTask: async () => {
        App.setLoading(true)
        const title = $('#title').val()
        const institution = $('#institution').val()
        const implicated = $('#implicated').val()
        const statement = $('#statement').val()
        const evidence = "NONE"

        // const evidence = $('#evidence').val()
        // Add the claim to the blockchain
        await App.claims.createCase(title, institution, implicated, statement, evidence)
    },

    renderClaims: async () => {
        // Load the total claim count from the blockchain
        const caseCount = await App.claims.caseCount()
        const $caseTemplate = $('.test')

        // Render out each claim with a new claim template
        for (var i = 1; i <= caseCount; i++) {
            // Fetch the claim data from the blockchain
            const claim = await App.claims.cases(i)
            const caseId = claim[0].toNumber()
            const title = claim[1]
            const date = new Date(claim[2].c[0])
            const institution = claim[3]
            const implicated = claim[4]
            const statement = claim[5]
            const evidence = claim[6]
            const status = "Submitted"
            const rewardAddress = claim[8]
            
            let btn = $('<button class="updt" onclick="App.updateCase(this)">Update</button>')
            let download = $('<button class="updt"><i class="fa fa-download" aria-hidden="true"></i> Download</button>')


            // Create the html for the claim
            const $newCaseTemplate = $caseTemplate.clone()
            $newCaseTemplate.find('.cid').html(caseId)
            $newCaseTemplate.find('.tit').html(title)
            $newCaseTemplate.find('.inst').html(institution)
            $newCaseTemplate.find('.impl').html(implicated)
            $newCaseTemplate.find('.date').html(date.toDateString())
            $newCaseTemplate.find('.status').html(status)
            $newCaseTemplate.find('.updateBtn').html(btn)
            $newCaseTemplate.find('.downloadBtn').html(download)


            $('.caseTemplate').append($newCaseTemplate)

            // Show the claim
            // $newCaseTemplate.show()
            console.log($newCaseTemplate)
        }
    },

    // Fetch a particular claim from the blockchain by ID
    renderCase: async () => {
        const caseCode = $('#claimCode').val()
        const aclaim = await App.claims.cases(caseCode)
        console.log(aclaim)
        if(aclaim){
            console.log("ok")
            const $caseTemp = $('.trial')
    
            // Fetch the claim data from the blockchain
            const caseId = aclaim[0].toNumber()
            const title = aclaim[1]
            const date = aclaim[2].toString()
            const institution = aclaim[3]
            const implicated = aclaim[4]
            const statement = aclaim[5]
            const evidence = aclaim[6]
            const status = aclaim[7].toString()
            const rewardAddress = aclaim[8]

            // Create the html for the claim
            const $newCaseTemp = $caseTemp.clone()
            $newCaseTemp.find('#claimno').val(caseId)
            $newCaseTemp.find('#claimtitle').val(title)
            $newCaseTemp.find('#claimstatus').val(status)

            $('#claimContent').append($newCaseTemp)

            // Show the claim
            $newCaseTemp.show()
            console.log($newCaseTemp)
            console.log($caseTemp)
        
        } else{
            console.log("Claim does not exist")
        }
    },

    updateCase: async () => {
        const caseCode = $('#cid').val()
        const cc = await App.claims.cases(caseCode)
        console.log(cc)
        if(cc){
            console.log("ok")
            await App.claims.updateCase(caseCode)
            alert("CLAIM SUCCESSFULLY UPDATED")
            window.location.reload()
        } else{
            console.log("ERROR")
        }
    },

    setLoading: (boolean) => {
        App.loading = boolean
        const loader = $('#loader')
        const content = $('#tcontent')
        if (boolean) {
            loader.show()
            content.hide()
        } else {
            loader.hide()
            content.show()
        }
    }
}


$(window).on('load', function () {
    App.load();
});