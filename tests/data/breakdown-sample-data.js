// Sample data with hierarchical breakdown structure
// Demonstrates enterprise breakdown capabilities

export const breakdownSampleData = [
    {
        label: "Starting Revenue",
        stacks: [{ value: 100000, color: "#3498db" }],
        breakdown: [
            {
                label: "Product A",
                stacks: [{ value: 45000, color: "#3498db" }],
                breakdown: [
                    { label: "Region North", stacks: [{ value: 20000, color: "#3498db" }] },
                    { label: "Region South", stacks: [{ value: 15000, color: "#3498db" }] },
                    { label: "Region East", stacks: [{ value: 7000, color: "#3498db" }] },
                    { label: "Region West", stacks: [{ value: 3000, color: "#3498db" }] }
                ]
            },
            {
                label: "Product B",
                stacks: [{ value: 35000, color: "#3498db" }],
                breakdown: [
                    { label: "Q1 Sales", stacks: [{ value: 12000, color: "#3498db" }] },
                    { label: "Q2 Sales", stacks: [{ value: 10000, color: "#3498db" }] },
                    { label: "Q3 Sales", stacks: [{ value: 8000, color: "#3498db" }] },
                    { label: "Q4 Sales", stacks: [{ value: 5000, color: "#3498db" }] }
                ]
            },
            {
                label: "Product C",
                stacks: [{ value: 20000, color: "#3498db" }],
                breakdown: [
                    { label: "Online", stacks: [{ value: 12000, color: "#3498db" }] },
                    { label: "Retail", stacks: [{ value: 8000, color: "#3498db" }] }
                ]
            }
        ]
    },
    {
        label: "Marketing Costs",
        stacks: [{ value: -15000, color: "#e74c3c" }],
        breakdown: [
            { label: "Digital Marketing", stacks: [{ value: -8000, color: "#e74c3c" }] },
            { label: "Traditional Marketing", stacks: [{ value: -4000, color: "#e74c3c" }] },
            { label: "Events & Sponsorship", stacks: [{ value: -2000, color: "#e74c3c" }] },
            { label: "Content Creation", stacks: [{ value: -1000, color: "#e74c3c" }] }
        ]
    },
    {
        label: "Operational Costs",
        stacks: [{ value: -25000, color: "#e67e22" }],
        breakdown: [
            {
                label: "Personnel",
                stacks: [{ value: -18000, color: "#e67e22" }],
                breakdown: [
                    { label: "Salaries", stacks: [{ value: -15000, color: "#e67e22" }] },
                    { label: "Benefits", stacks: [{ value: -2000, color: "#e67e22" }] },
                    { label: "Training", stacks: [{ value: -1000, color: "#e67e22" }] }
                ]
            },
            { label: "Infrastructure", stacks: [{ value: -4000, color: "#e67e22" }] },
            { label: "Software Licenses", stacks: [{ value: -2000, color: "#e67e22" }] },
            { label: "Office Rent", stacks: [{ value: -1000, color: "#e67e22" }] }
        ]
    },
    {
        label: "Tax Benefits",
        stacks: [{ value: 5000, color: "#27ae60" }],
        breakdown: [
            { label: "R&D Tax Credit", stacks: [{ value: 3000, color: "#27ae60" }] },
            { label: "Export Incentive", stacks: [{ value: 1500, color: "#27ae60" }] },
            { label: "Green Energy Credit", stacks: [{ value: 500, color: "#27ae60" }] }
        ]
    }
];

export const simpleBreakdownData = [
    {
        label: "Starting Value",
        stacks: [{ value: 50000, color: "#3498db" }]
    },
    {
        label: "Sales Revenue",
        stacks: [{ value: 25000, color: "#2ecc71" }],
        breakdown: [
            { label: "Product Sales", stacks: [{ value: 18000, color: "#2ecc71" }] },
            { label: "Service Revenue", stacks: [{ value: 5000, color: "#2ecc71" }] },
            { label: "Licensing", stacks: [{ value: 2000, color: "#2ecc71" }] }
        ]
    },
    {
        label: "Operating Expenses",
        stacks: [{ value: -12000, color: "#e74c3c" }],
        breakdown: [
            { label: "Salaries", stacks: [{ value: -8000, color: "#e74c3c" }] },
            { label: "Office Rent", stacks: [{ value: -2000, color: "#e74c3c" }] },
            { label: "Utilities", stacks: [{ value: -1000, color: "#e74c3c" }] },
            { label: "Software", stacks: [{ value: -500, color: "#e74c3c" }] },
            { label: "Travel", stacks: [{ value: -300, color: "#e74c3c" }] },
            { label: "Miscellaneous", stacks: [{ value: -200, color: "#e74c3c" }] }
        ]
    },
    {
        label: "Other Income",
        stacks: [{ value: 3000, color: "#f39c12" }]
    }
];

// Data for testing maximum breakdown limits and "Others" grouping
export const complexBreakdownData = [
    {
        label: "Total Revenue",
        stacks: [{ value: 100000, color: "#3498db" }],
        breakdown: [
            { label: "Product 1", stacks: [{ value: 25000, color: "#3498db" }] },
            { label: "Product 2", stacks: [{ value: 20000, color: "#3498db" }] },
            { label: "Product 3", stacks: [{ value: 15000, color: "#3498db" }] },
            { label: "Product 4", stacks: [{ value: 12000, color: "#3498db" }] },
            { label: "Product 5", stacks: [{ value: 10000, color: "#3498db" }] },
            { label: "Product 6", stacks: [{ value: 8000, color: "#3498db" }] },
            { label: "Product 7", stacks: [{ value: 5000, color: "#3498db" }] },
            { label: "Product 8", stacks: [{ value: 3000, color: "#3498db" }] },
            { label: "Product 9", stacks: [{ value: 1500, color: "#3498db" }] },
            { label: "Product 10", stacks: [{ value: 500, color: "#3498db" }] }
        ]
    }
];

// Configuration presets for different breakdown scenarios
export const breakdownConfigs = {
    basic: {
        enabled: true,
        maxBreakdowns: 5,
        showOthers: true,
        otherLabel: "Others",
        otherColor: "#95a5a6"
    },
    
    detailed: {
        enabled: true,
        maxBreakdowns: 10,
        showOthers: false,
        animation: {
            enabled: true,
            duration: 300,
            stagger: 25
        },
        visual: {
            indentSize: 15,
            connectorLine: true,
            connectorColor: "#bdc3c7"
        }
    },
    
    minimal: {
        enabled: true,
        maxBreakdowns: 3,
        showOthers: true,
        otherLabel: "Other Items",
        animation: {
            enabled: false
        },
        visual: {
            indentSize: 10,
            connectorLine: false
        }
    },
    
    enterprise: {
        enabled: true,
        maxBreakdowns: 15,
        showOthers: true,
        otherLabel: "Other Categories",
        otherColor: "#95a5a6",
        animation: {
            enabled: true,
            duration: 500,
            stagger: 50
        },
        grouping: {
            strategy: "value",
            direction: "desc"
        },
        interaction: {
            clickToExpand: true,
            doubleClickToCollapse: true,
            keyboardNavigation: true
        },
        visual: {
            indentSize: 25,
            connectorLine: true,
            connectorColor: "#bdc3c7",
            highlightParent: true
        }
    }
};
