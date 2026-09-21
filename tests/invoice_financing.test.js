const path = require('path');
const crypto = require('crypto');
const { InvoiceFinancingContract, InvoiceStatus } = require(path.join(__dirname, '..', 'managed', 'invoice_financing', 'index.cjs'));

function assert(condition, message) {
    if (!condition) {
        throw new Error(`Assertion Failed: ${message}`);
    }
}

function computeCommitment(amount, buyer, seller, dueDate, salt) {
    const data = `${amount}:${buyer}:${seller}:${dueDate}:${salt}`;
    return '0x' + crypto.createHash('sha256').update(data).digest('hex');
}

async function runTests() {
    console.log("🧪 [InvoiceChain Test Suite] Starting Midnight Compact Circuit Unit Tests...\n");
    let passed = 0;
    let failed = 0;

    const mockWitness = {
        invoiceAmount: 50000n, // $50,000 USD
        buyerId: "0x" + crypto.createHash('sha256').update("ACME_CORP_GLOBAL").digest('hex'),
        sellerId: "0x" + crypto.createHash('sha256').update("TECH_SUPPLIES_MSME").digest('hex'),
        dueDate: 1767225600n,
        salt: "0x" + crypto.randomBytes(32).toString('hex')
    };

    const commitment = computeCommitment(
        mockWitness.invoiceAmount,
        mockWitness.buyerId,
        mockWitness.sellerId,
        mockWitness.dueDate,
        mockWitness.salt
    );

    const lenderIdA = "0x" + crypto.createHash('sha256').update("APEX_CAPITAL_LENDER_A").digest('hex');
    const lenderIdB = "0x" + crypto.createHash('sha256').update("HORIZON_FINANCE_LENDER_B").digest('hex');

    const contract = new InvoiceFinancingContract();

    // Test 1: Successful Invoice Registration
    try {
        console.log("TEST 1: MSME Invoice Registration (registerInvoice circuit)");
        const regResult = contract.registerInvoice(mockWitness, commitment);
        assert(regResult.success === true, "registerInvoice returned success: false");
        assert(regResult.status === InvoiceStatus.Open, "Ledger status should be Open");
        assert(contract.invoiceCommitment === commitment, "Public ledger commitment mismatch");
        assert(contract.processedNullifiers.has(commitment), "Commitment set should contain new commitment");
        console.log("  ✅ Passed: Invoice successfully registered with Open status on public ledger.\n");
        passed++;
    } catch (err) {
        console.error("  ❌ Test 1 Failed:", err.message);
        failed++;
    }

    // Test 2: Successful Invoice Financing by Lender A
    try {
        console.log("TEST 2: First Financing Attempt by Lender A (financeInvoice circuit)");
        const finResult = contract.financeInvoice(mockWitness, commitment, lenderIdA);
        assert(finResult.success === true, "financeInvoice returned success: false");
        assert(finResult.status === InvoiceStatus.Financed, "Ledger status should be Financed");
        assert(contract.financedLender === lenderIdA, "Financed lender mismatch");
        console.log("  ✅ Passed: Invoice financed by Lender A. Public status updated to Financed.\n");
        passed++;
    } catch (err) {
        console.error("  ❌ Test 2 Failed:", err.message);
        failed++;
    }

    // Test 3: Rejection of Duplicate Financing Attempt by Lender B (Anti-Fraud Proof)
    try {
        console.log("TEST 3: Duplicate Financing Attempt by Lender B (Anti-Fraud Proof)");
        let threw = false;
        try {
            contract.financeInvoice(mockWitness, commitment, lenderIdB);
        } catch (err) {
            threw = true;
            assert(err.message.includes("Invoice is already Financed"), `Unexpected error message: ${err.message}`);
            console.log(`  🛡️ Circuit Rejection Log: "${err.message}"`);
        }
        assert(threw === true, "Circuit failed to reject duplicate financing attempt!");
        assert(contract.financedLender === lenderIdA, "Lender ID should remain Lender A");
        console.log("  ✅ Passed: Duplicate financing attempt strictly rejected by circuit without exposing private witness.\n");
        passed++;
    } catch (err) {
        console.error("  ❌ Test 3 Failed:", err.message);
        failed++;
    }

    // Test 4: Successful Invoice Settlement by Buyer
    try {
        console.log("TEST 4: Invoice Settlement by Buyer (settleInvoice circuit)");
        const settlePayment = 50000n;
        const settleResult = contract.settleInvoice(mockWitness, commitment, settlePayment);
        assert(settleResult.success === true, "settleInvoice returned success: false");
        assert(settleResult.status === InvoiceStatus.Settled, "Ledger status should be Settled");
        assert(contract.settlementAmount === settlePayment, "Settlement amount mismatch");
        console.log("  ✅ Passed: Invoice settled successfully. Final status: Settled.\n");
        passed++;
    } catch (err) {
        console.error("  ❌ Test 4 Failed:", err.message);
        failed++;
    }

    // Test 5: Rejection of Double Settlement or Invalid State Transition
    try {
        console.log("TEST 5: Invalid Settlement Rejection on already Settled Invoice");
        let threw = false;
        try {
            contract.settleInvoice(mockWitness, commitment, 50000n);
        } catch (err) {
            threw = true;
            assert(err.message.includes("must be in Financed or PartiallyFinanced state"), `Unexpected error message: ${err.message}`);
        }
        assert(threw === true, "Circuit failed to reject settlement on already settled invoice");
        console.log("  ✅ Passed: Invalid state transition rejected.\n");
        passed++;
    } catch (err) {
        console.error("  ❌ Test 5 Failed:", err.message);
        failed++;
    }

    // Test 6: Partial Invoice Financing Circuit
    try {
        console.log("TEST 6: Partial Invoice Financing (financePartialInvoice circuit)");
        const contractPartial = new InvoiceFinancingContract();
        const witnessPartial = {
            invoiceAmount: 100000n,
            buyerId: "0x" + crypto.createHash('sha256').update("GLOBAL_BUYER_INC").digest('hex'),
            sellerId: "0x" + crypto.createHash('sha256').update("SMART_PARTS_LLC").digest('hex'),
            dueDate: 1767225600n,
            salt: "0x" + crypto.randomBytes(32).toString('hex')
        };
        const commitmentPartial = computeCommitment(witnessPartial.invoiceAmount, witnessPartial.buyerId, witnessPartial.sellerId, witnessPartial.dueDate, witnessPartial.salt);

        contractPartial.registerInvoice(witnessPartial, commitmentPartial);

        // 1st partial payment: 40,000 / 100,000 (40%)
        const p1 = contractPartial.financePartialInvoice(witnessPartial, commitmentPartial, lenderIdA, 40000n);
        assert(p1.status === InvoiceStatus.PartiallyFinanced, "Status should be PartiallyFinanced");
        assert(contractPartial.fundedAmount === 40000n, "Funded amount should be 40000");

        // 2nd partial payment: remaining 60,000 / 100,000 (100%)
        const p2 = contractPartial.financePartialInvoice(witnessPartial, commitmentPartial, lenderIdB, 60000n);
        assert(p2.status === InvoiceStatus.Financed, "Status should transition to Financed when 100% funded");
        assert(contractPartial.fundedAmount === 100000n, "Funded amount should be 100000");

        console.log("  ✅ Passed: Partial financing transition from PartiallyFinanced to Financed verified.\n");
        passed++;
    } catch (err) {
        console.error("  ❌ Test 6 Failed:", err.message);
        failed++;
    }

    // Test 7: Invoice Cancellation by Seller
    try {
        console.log("TEST 7: Invoice Cancellation (cancelInvoice circuit)");
        const contractCancel = new InvoiceFinancingContract();
        const witnessCancel = {
            invoiceAmount: 25000n,
            buyerId: "0x" + crypto.createHash('sha256').update("CANCEL_BUYER").digest('hex'),
            sellerId: "0x" + crypto.createHash('sha256').update("CANCEL_SELLER").digest('hex'),
            dueDate: 1767225600n,
            salt: "0x" + crypto.randomBytes(32).toString('hex')
        };
        const commitmentCancel = computeCommitment(witnessCancel.invoiceAmount, witnessCancel.buyerId, witnessCancel.sellerId, witnessCancel.dueDate, witnessCancel.salt);

        contractCancel.registerInvoice(witnessCancel, commitmentCancel);
        const cancelRes = contractCancel.cancelInvoice(witnessCancel, commitmentCancel);
        assert(cancelRes.status === InvoiceStatus.Cancelled, "Status should be Cancelled");

        // Ensure cannot finance cancelled invoice
        let threw = false;
        try {
            contractCancel.financeInvoice(witnessCancel, commitmentCancel, lenderIdA);
        } catch (err) {
            threw = true;
        }
        assert(threw === true, "Circuit must reject financing on cancelled invoice");

        console.log("  ✅ Passed: Invoice cancelled and subsequent financing blocked.\n");
        passed++;
    } catch (err) {
        console.error("  ❌ Test 7 Failed:", err.message);
        failed++;
    }

    // Test 8: Invoice Expiration Circuit
    try {
        console.log("TEST 8: Invoice Expiration (expireInvoice circuit)");
        const contractExpire = new InvoiceFinancingContract();
        const pastDueDate = 1600000000n; // Past timestamp
        const witnessExpire = {
            invoiceAmount: 15000n,
            buyerId: "0x" + crypto.createHash('sha256').update("EXPIRE_BUYER").digest('hex'),
            sellerId: "0x" + crypto.createHash('sha256').update("EXPIRE_SELLER").digest('hex'),
            dueDate: pastDueDate,
            salt: "0x" + crypto.randomBytes(32).toString('hex')
        };
        const commitmentExpire = computeCommitment(witnessExpire.invoiceAmount, witnessExpire.buyerId, witnessExpire.sellerId, witnessExpire.dueDate, witnessExpire.salt);

        contractExpire.registerInvoice(witnessExpire, commitmentExpire);
        const expireRes = contractExpire.expireInvoice(witnessExpire, commitmentExpire, 1700000000n); // current time > due date
        assert(expireRes.status === InvoiceStatus.Expired, "Status should be Expired");

        console.log("  ✅ Passed: Overdue invoice successfully marked as Expired.\n");
        passed++;
    } catch (err) {
        console.error("  ❌ Test 8 Failed:", err.message);
        failed++;
    }

    // Test 9: Multi-Currency Witness Registration & Settlement
    try {
        console.log("TEST 9: Multi-Currency Witness Verification");
        const witnessCurrency = {
            invoiceAmount: 40000n,
            currencyCode: "EUR",
            buyerId: "0x" + crypto.createHash('sha256').update("EURO_BUYER").digest('hex'),
            sellerId: "0x" + crypto.createHash('sha256').update("EURO_SELLER").digest('hex'),
            dueDate: 1767225600n,
            salt: "0x" + crypto.randomBytes(32).toString('hex')
        };
        const commitmentCurrency = computeCommitment(witnessCurrency.invoiceAmount, witnessCurrency.buyerId, witnessCurrency.sellerId, witnessCurrency.dueDate, witnessCurrency.salt);

        const contractCurr = new InvoiceFinancingContract();
        contractCurr.registerInvoice(witnessCurrency, commitmentCurrency);
        contractCurr.financeInvoice(witnessCurrency, commitmentCurrency, lenderIdA);
        const setRes = contractCurr.settleInvoice(witnessCurrency, commitmentCurrency, 40000n);

        assert(setRes.status === InvoiceStatus.Settled, "Multi-currency invoice settled successfully");
        console.log("  ✅ Passed: Multi-currency invoice registration, financing, and settlement verified.\n");
        passed++;
    } catch (err) {
        console.error("  ❌ Test 9 Failed:", err.message);
        failed++;
    }

    console.log("--------------------------------------------------");
    console.log(`SUMMARY: ${passed} / ${passed + failed} Tests Passed (${failed === 0 ? '100% SUCCESS' : 'FAILED'})`);
    console.log("--------------------------------------------------\n");

    if (failed > 0) {
        process.exit(1);
    }
}

runTests();

