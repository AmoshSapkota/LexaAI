variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
  default     = "aiapp-dev-rg"
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "East US"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

# AKS Variables
variable "aks_cluster_name" {
  description = "Name of the AKS cluster"
  type        = string
  default     = "aiapp-dev-aks"
}

variable "aks_dns_prefix" {
  description = "DNS prefix for the AKS cluster"
  type        = string
  default     = "aiapp-dev"
}

variable "aks_node_count" {
  description = "Number of nodes in the AKS cluster"
  type        = number
  default     = 2
}

variable "aks_node_size" {
  description = "Size of the AKS nodes"
  type        = string
  default     = "Standard_D2s_v3"
}

# ACR Variables
variable "acr_name" {
  description = "Name of the Azure Container Registry"
  type        = string
  default     = "aiappdevacr"
}

# Key Vault Variables
variable "key_vault_name" {
  description = "Name of the Key Vault"
  type        = string
  default     = "aiapp-dev-kv"
}

# Networking Variables
variable "vnet_name" {
  description = "Name of the virtual network"
  type        = string
  default     = "aiapp-dev-vnet"
}

variable "vnet_address_space" {
  description = "Address space for the virtual network"
  type        = list(string)
  default     = ["10.0.0.0/16"]
}

# Database Variables
variable "postgres_server_name" {
  description = "Name of the PostgreSQL server"
  type        = string
  default     = "aiapp-dev-postgres"
}

variable "redis_name" {
  description = "Name of the Redis cache"
  type        = string
  default     = "aiapp-dev-redis"
}

# Tags
variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    Environment = "dev"
    Project     = "AI-APP"
    ManagedBy   = "Terraform"
  }
}