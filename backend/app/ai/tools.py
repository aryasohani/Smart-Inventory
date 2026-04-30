"""
Tool definitions for AI function calling.
These map to real DB queries - no fake data ever returned.
"""

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_low_stock_products",
            "description": "Retrieve products that are below their reorder threshold. Returns actual live data from the database.",
            "parameters": {
                "type": "object",
                "properties": {
                    "limit": {
                        "type": "integer",
                        "description": "Maximum number of products to return (default: 20)",
                        "default": 20,
                    }
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_product_detail",
            "description": "Get detailed information about a specific product by its ID or SKU.",
            "parameters": {
                "type": "object",
                "properties": {
                    "product_id": {
                        "type": "string",
                        "description": "The product UUID",
                    },
                    "sku": {
                        "type": "string",
                        "description": "The product SKU code",
                    },
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_po_history",
            "description": "Retrieve purchase order history, optionally filtered by supplier or status.",
            "parameters": {
                "type": "object",
                "properties": {
                    "supplier_id": {
                        "type": "string",
                        "description": "Filter by supplier UUID",
                    },
                    "status": {
                        "type": "string",
                        "enum": ["draft", "sent", "acknowledged", "received", "cancelled"],
                        "description": "Filter by PO status",
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Maximum records to return",
                        "default": 10,
                    },
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_expiring_products",
            "description": "Find products expiring within a specified number of days.",
            "parameters": {
                "type": "object",
                "properties": {
                    "days": {
                        "type": "integer",
                        "description": "Number of days to look ahead (default: 14)",
                        "default": 14,
                    }
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "create_draft_po",
            "description": "Create a draft purchase order for a supplier with specified items.",
            "parameters": {
                "type": "object",
                "properties": {
                    "supplier_id": {
                        "type": "string",
                        "description": "UUID of the supplier",
                    },
                    "items": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "product_name": {"type": "string"},
                                "sku": {"type": "string"},
                                "quantity": {"type": "integer"},
                                "unit_price": {"type": "number"},
                            },
                            "required": ["product_name", "quantity", "unit_price"],
                        },
                        "description": "List of items to order",
                    },
                    "notes": {
                        "type": "string",
                        "description": "Optional notes for the PO",
                    },
                },
                "required": ["supplier_id", "items"],
            },
        },
    },
]