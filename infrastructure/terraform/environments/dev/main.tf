terraform {
  required_version = ">= 1.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~>3.0"
    }
  }
  backend "azurerm" {
    resource_group_name  = "aiapp-terraform-state-rg"
    storage_account_name = "aiappterraformstate"
    container_name      = "terraform-state"
    key                 = "dev.terraform.tfstate"
  }
}

provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy = true
    }
    resource_group {
      prevent_deletion_if_contains_resources = false
    }
  }
}

# Data sources
data "azurerm_client_config" "current" {}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = var.resource_group_name
  location = var.location

  tags = var.tags
}

# AKS Cluster
module "dev_aks" {
  source = "../../modules/dev-aks"

  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  cluster_name       = var.aks_cluster_name
  dns_prefix         = var.aks_dns_prefix
  
  node_count         = var.aks_node_count
  node_size          = var.aks_node_size
  
  tags = var.tags
}

# Container Registry
module "acr" {
  source = "../../modules/acr"

  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  acr_name           = var.acr_name
  
  tags = var.tags
}

# Key Vault
module "key_vault" {
  source = "../../modules/key-vault"

  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  key_vault_name     = var.key_vault_name
  tenant_id          = data.azurerm_client_config.current.tenant_id
  
  tags = var.tags
}

# Networking
module "networking" {
  source = "../../modules/networking"

  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  vnet_name          = var.vnet_name
  vnet_address_space = var.vnet_address_space
  
  tags = var.tags
}

# Databases
module "databases" {
  source = "../../modules/databases"

  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  postgres_server_name = var.postgres_server_name
  redis_name         = var.redis_name
  
  tags = var.tags
}

# Messaging
module "messaging" {
  source = "../../modules/messaging"

  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  
  tags = var.tags
}

# Monitoring
module "monitoring" {
  source = "../../modules/monitoring"

  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  
  tags = var.tags
}