import React, { useEffect, useState } from 'react';
import asyncScriptLoader from 'react-async-script';

function StripePricingTable({ isScriptLoaded, isScriptLoadSucceed }) {
    useEffect(() => {
        if (isScriptLoaded && isScriptLoadSucceed) {
            const stripePricingTable = document.createElement('stripe-pricing-table');
            stripePricingTable.setAttribute('pricing-table-id', 'prctbl_1NYGkvCr38bAPvsiRelMefS7');
            stripePricingTable.setAttribute('publishable-key', 'pk_test_51NXCIeCr38bAPvsiuT1fMi3ViuEyflIe8cEUGULmqZofhikYJxsivM8PvQJHlx0xjjGpupbN7Zp54B0f8yryXGPK00FRWvUNXT');
            document.getElementById('stripe-pricing-table').appendChild(stripePricingTable);
        }
    }, [isScriptLoaded, isScriptLoadSucceed]);

    return <div id="stripe-pricing-table" style={{ width: '100%', height: '800px' }}></div>;

}

export default asyncScriptLoader('https://js.stripe.com/v3/pricing-table.jsx')(StripePricingTable);
