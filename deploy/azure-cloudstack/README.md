# Conecta Social sobre Apache CloudStack (host na Azure)

API publicada em **https://57-156-63-84.sslip.io** — Swagger em **https://57-156-63-84.sslip.io/api/docs**.

Painel do CloudStack em **https://painel.57-156-63-84.sslip.io** (conta `professor` somente leitura; `admin` para administração).

A aplicação roda dentro de uma VM **criada e gerenciada pelo Apache CloudStack 4.22.1.1**, que por sua vez está instalado numa VM da Azure com virtualização aninhada.

## Camadas

| Camada | Recurso |
| --- | --- |
| Nuvem pública | Azure for Students · Chile Central · `rg-cloudstack-conecta` |
| Host CloudStack | `vm-cloudstack` — Standard_D4s_v4 (4 vCPU, 16 GB) · Ubuntu 24.04 · KVM aninhado · IP 57.156.63.84 |
| CloudStack | Management Server + MySQL + NFS + agente KVM no mesmo host (`cs-azure.lab.local`) |
| Zona | `Azure-Zone` (Advanced) · `Azure-Pod` · `Azure-KVM-Cluster` · Primary/Secondary NFS |
| Redes | `cloudbr0` 192.168.100.0/24 (gerência) · `cloudbr1` 192.168.200.0/24 (pública + VLANs guest 100–200) |
| Rede do projeto | `rede-conecta-social` 10.1.1.0/24 com Virtual Router |
| VM da aplicação | `vm-conecta-social` (template Ubuntu 24.04 cloud, 2 vCPU / 4 GB, 20 GB) · IP público CloudStack 192.168.200.13 (NAT estático) |
| Aplicação | `docker compose`: PostgreSQL 15 (sem porta pública) + API (`maiconmaul/conecta-social-api:latest`, publicada pela pipeline) + Caddy (HTTPS Let's Encrypt) |

Caminho de uma requisição: **Internet → NSG Azure (80/443) → `vm-cloudstack` eth0 → DNAT nftables → 192.168.200.13 → Virtual Router (NAT estático + firewall) → `vm-conecta-social` → Caddy → API → PostgreSQL**.

## Acesso

| Para | Como |
| --- | --- |
| Ligar / desligar | atalhos "Ligar/Desligar VM CloudStack (Azure)" na Área de Trabalho, ou `az vm start` / `az vm deallocate -g rg-cloudstack-conecta -n vm-cloudstack` |
| Painel CloudStack | https://painel.57-156-63-84.sslip.io · `professor` (papel *Read-Only Admin*) ou `admin` · alternativa sem internet: atalho "Abrir painel CloudStack (Azure)" (túnel SSH) → http://127.0.0.1:8081/client |
| Host | `ssh cs-azure` (somente do IP liberado no NSG) |
| VM da aplicação | `ssh conecta-vm` (via host, `ProxyJump`) · `cd ~/conecta && sudo docker compose ps` |

Senhas e segredos ficam em `Downloads\azure-cloudstack.local.env` (fora do Git).

## Custos e proteções

- VM desalocada não consome crédito de CPU; disco e IP fixo custam ~US$ 17/mês.
- Timer `desalocar-vm.timer` no host desaloca a VM todo dia às 02:00 UTC (23:00 Brasília) usando a identidade gerenciada da própria VM.
- Orçamento `orcamento-cloudstack` (US$ 60/mês) com alertas por e-mail em 50% e 90%.

## Ao religar

MySQL, Management, agente, System VMs e Virtual Router sobem sozinhos. A VM da aplicação **não** é religada pelo CloudStack (host único, sem HA): o serviço `iniciar-vms-cloudstack.service` no host espera a API e liga as VMs paradas. Os containers voltam com `restart: always`. Ciclo testado: desalocar → ligar → API respondendo em cerca de 5 minutos.

## Publicação do painel

O Caddy da `vm-conecta-social` atende também `painel.57-156-63-84.sslip.io` e repassa para o Management Server em `192.168.200.1:8080` (IP do host na rede pública do CloudStack). Nenhuma porta extra foi aberta. O botão **Console** das VMs não funciona de fora, porque a Console Proxy VM usa IP interno.

## Entrega contínua (CI/CD)

A pipeline do repositório (`.github/workflows/main.yml`) não precisou mudar. A cada push na `main` ela testa, gera e publica `maiconmaul/conecta-social-api:latest` no Docker Hub. A `vm-conecta-social` busca essa imagem sozinha (modelo *pull*):

```
commit na main → CI (build + testes) → CD publica a imagem no Docker Hub → vm-conecta-social detecta a imagem nova → recria a API → migrations aplicadas na subida
```

- `atualizar-conecta.timer` roda 2 minutos após o boot e depois a cada 5 minutos.
- O script `/usr/local/sbin/atualizar-conecta` só recria a API quando a imagem mudou e registra cada troca em `/var/log/atualizar-conecta.log`.
- Com a VM desalocada nada é perdido: ao ligar, ela já baixa a versão mais recente.
- Nenhuma porta foi aberta e nenhum segredo foi adicionado ao GitHub, diferente de um deploy por SSH a partir da pipeline.

Teste realizado: API rebaixada para 0.30.0 → atualizador detectou a 0.31.0 no Docker Hub → container recriado com 0.31.0 → API pública respondendo (200).

Ver a versão em produção e o histórico:

```bash
ssh conecta-vm 'sudo docker exec conecta-api-1 grep -m1 "\"version\"" package.json; sudo tail /var/log/atualizar-conecta.log'
```
