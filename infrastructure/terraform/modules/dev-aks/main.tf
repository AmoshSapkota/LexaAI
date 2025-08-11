resource "azurerm_kubernetes_cluster" "main" {
  name                = var.cluster_name
  location            = var.location
  resource_group_name = var.resource_group_name
  dns_prefix          = var.dns_prefix

  default_node_pool {
    name       = "default"
    node_count = var.node_count
    vm_size    = var.node_size
    
    # Enable auto-scaling for cost optimization in dev
    enable_auto_scaling = true
    min_count          = 1
    max_count          = var.node_count + 2
  }

  identity {
    type = "SystemAssigned"
  }

  # Network profile for advanced networking
  network_profile {
    network_plugin    = "kubenet"
    load_balancer_sku = "standard"
  }

  # Enable monitoring addon
  oms_agent {
    log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  }

  # RBAC configuration
  role_based_access_control_enabled = true

  # Azure AD integration
  azure_active_directory_role_based_access_control {
    managed            = true
    azure_rbac_enabled = true
  }

  tags = var.tags
}

# Log Analytics Workspace for AKS monitoring
resource "azurerm_log_analytics_workspace" "main" {
  name                = "${var.cluster_name}-logs"
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = "PerGB2018"
  retention_in_days   = 30

  tags = var.tags
}

# Additional node pool for system workloads
resource "azurerm_kubernetes_cluster_node_pool" "system" {
  name                  = "system"
  kubernetes_cluster_id = azurerm_kubernetes_cluster.main.id
  vm_size              = "Standard_D2s_v3"
  node_count           = 1
  
  enable_auto_scaling = true
  min_count          = 1
  max_count          = 3

  node_taints = ["CriticalAddonsOnly=true:NoSchedule"]
  node_labels = {
    "nodepool-type" = "system"
    "environment"   = var.tags["Environment"]
  }

  tags = var.tags
}