<style lang="scss" scoped>
.chat_list{
	display: block;
	&__name{
		display: flex;
		align-items: center;
		justify-content: flex-start;
		cursor: pointer;
		gap: 5px;
		user-select: none;
		padding-top: 5px;
		padding-bottom: 5px;
		img{
			width: 16px;
			height: 16px;
		}
	}
	&__items{
		display: none;
		position: absolute;
		background: var(--vscode-input-background, white);
		border: 1px var(--border-color) solid;
		z-index: 999;
	}
	&__item{
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 5px;
		cursor: pointer;
		user-select: none;
		padding: 5px 10px;
		border-bottom: 1px var(--border-color) solid;
	}
	&__item:hover{
		background-color: var(--hover-color);
	}
	&__item:last-child{
		border-bottom-width: 0px;
	}
	&__buttons{
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 5px;
	}
	&__button{
		cursor: pointer;
		user-select: none;
		img{
			width: 16px;
			height: 16px;
		}
	}
	&.show .chat_list__items{
		display: block;
	}
}
:global(body.vscode-dark){
	.chat_list__item:hover{
		background-color: var(--vscode-button-background);
	}
	.chat_list__button, .chat_list__name{
		img{
			filter: invert(1);
		}
	}
}
</style>

<template>
	<div class="chat_list" :class="{ 'show': showMenu }">
		<div class="chat_list__name" @click="toggleMenu">
			<span>{{ currentItem ? currentItem.title : "New chat" }}</span>
			<img :src="layout.getImage('dropdown.svg')" />
		</div>
		<div class="chat_list__items">
			<div v-if="!model.loading">
				<div class="chat_list__item" @click="selectItem(null)">
					New chat
				</div>
				<div class="chat_list__item" v-for="item in items" :key="item.id"
					@click="selectItem(item.id)"
				>
					<div class="chat_list__label">{{ item.title }}</div>
					<div class="chat_list__buttons">
						<span class="chat_list__button" @click="onEdit($event, item.id)">
							<img :src="layout.getImage('edit.svg')" />
						</span>
						<span class="chat_list__button" @click="onDelete($event, item.id)">
							<img :src="layout.getImage('trash.svg')" />
						</span>
					</div>
				</div>
			</div>
			<div class="chat_list__item" v-else>
				Loading ...
			</div>
		</div>
	</div>
</template>

<script lang="js">
export default {
	name: "ChatList",
	data: function(){
		return {
			showMenu: false,
		};
	},
	computed:
	{
		model()
		{
			return this.layout.chat_page;
		},
		items()
		{
			return this.model.chats;
		},
		currentItem()
		{
			return this.model.getCurrentChat();
		},
	},
	methods:
	{
		selectItem(id)
		{
			this.model.show_dialog = "";
			this.model.selectItem(id);
			this.hideMenu();
		},
		hideMenu()
		{
			this.showMenu = false;
		},
		toggleMenu()
		{
			this.showMenu = !this.showMenu;
		},
		onEdit(e, id)
		{
			e.stopPropagation();
			this.hideMenu();
			this.model.showEdit(id);
		},
		onDelete(e, id)
		{
			e.stopPropagation();
			this.hideMenu();
			this.model.showDelete(id);
		},
	}
}
</script>